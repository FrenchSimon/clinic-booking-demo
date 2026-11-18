-- The invited physio is not a member yet, so RLS hides the invitation from
-- them. These two SECURITY DEFINER functions are the only way in, and both
-- need the secret token from the email link.

-- What the invite page shows once the physio is signed in: the clinic's name
-- and the address the invitation was sent to.
CREATE OR REPLACE FUNCTION private.invitation_preview(token text)
RETURNS TABLE (clinic_name text, email text, status text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT c.name, i.email,
    CASE
      WHEN i.accepted_at IS NOT NULL THEN 'accepted'
      WHEN i.expires_at < now() THEN 'expired'
      ELSE 'open'
    END
  FROM public.invitations i
  JOIN public.clinics c ON c.id = i.clinic_id
  WHERE i.token_hash = encode(sha256(convert_to(token, 'UTF8')), 'hex');
END;
$$;
--> statement-breakpoint
-- Joins the clinic as a physio. Only for the account whose email received the
-- invitation, only once, only before it expires. Errors are stable codes the
-- app turns into messages.
CREATE OR REPLACE FUNCTION private.accept_invitation(token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  inv public.invitations;
  user_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_signed_in' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO inv FROM public.invitations
  WHERE token_hash = encode(sha256(convert_to(token, 'UTF8')), 'hex')
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF inv.accepted_at IS NOT NULL THEN
    IF inv.accepted_by = auth.uid() THEN
      RETURN inv.clinic_id;
    END IF;
    RAISE EXCEPTION 'invitation_used' USING ERRCODE = 'P0001';
  END IF;
  IF inv.expires_at < now() THEN
    RAISE EXCEPTION 'invitation_expired' USING ERRCODE = 'P0001';
  END IF;

  SELECT lower(u.email) INTO user_email FROM auth.users u WHERE u.id = auth.uid();
  IF user_email IS DISTINCT FROM inv.email THEN
    RAISE EXCEPTION 'invitation_email_mismatch' USING ERRCODE = 'P0001';
  END IF;

  -- A patient of the clinic becomes a physio; an owner stays owner.
  INSERT INTO public.memberships (clinic_id, user_id, role, display_name)
  VALUES (inv.clinic_id, auth.uid(), 'practitioner', inv.name)
  ON CONFLICT (clinic_id, user_id) DO UPDATE
    SET role = 'practitioner', display_name = EXCLUDED.display_name
    WHERE public.memberships.role = 'patient';

  UPDATE public.invitations
  SET accepted_at = now(), accepted_by = auth.uid()
  WHERE id = inv.id;

  RETURN inv.clinic_id;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.invitation_preview(text) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.accept_invitation(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION private.invitation_preview(text) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION private.accept_invitation(text) TO authenticated;
