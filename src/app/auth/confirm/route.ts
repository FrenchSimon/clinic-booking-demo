import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { safeNext } from "@/features/auth/schema";
import { createClient } from "@/lib/supabase/server";

const otpType = z.enum([
  "signup",
  "email",
  "recovery",
  "invite",
  "email_change",
]);

// Every link Supabase sends by email lands here: sign-up confirmation and password reset.
// The link carries either a one-time code (PKCE) or a token hash, depending on the email template.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"));
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = otpType.safeParse(params.get("type"));

  const supabase = await createClient();
  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type.success) {
    const result = await supabase.auth.verifyOtp({
      type: type.data,
      token_hash: tokenHash,
    });
    ok = !result.error;
  }

  redirect(ok ? next : "/login?error=link");
}
