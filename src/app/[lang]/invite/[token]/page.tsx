import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { AcceptForm } from "@/features/invitations/components/accept-form";
import { previewInvitation } from "@/features/invitations/preview";
import { TOKEN_PATTERN } from "@/features/invitations/schema";
import { getUser } from "@/server/auth";

// Landing page of the invitation email. Nothing about the clinic is shown
// before sign-in: the token alone never reveals data to an anonymous visitor.
export default function InvitePage({
  params,
}: PageProps<"/[lang]/invite/[token]">) {
  return (
    <AuthShell title="You're invited">
      <Suspense fallback={null}>
        {params.then(({ token }) => (
          <Invitation token={token} />
        ))}
      </Suspense>
    </AuthShell>
  );
}

async function Invitation({ token }: { token: string }) {
  if (!TOKEN_PATTERN.test(token)) notFound();
  const next = `/invite/${token}`;
  const user = await getUser();

  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        <p>
          A clinic invited you to join Kinora as a physio. Create your account,
          or log in, with the email address the invitation was sent to.
        </p>
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className={buttonVariants({ size: "lg" })}
        >
          Create my account
        </Link>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          I already have an account
        </Link>
      </div>
    );
  }

  const invitation = await previewInvitation(user.id, token);
  if (!invitation) {
    return <p role="alert">This invitation link is not valid.</p>;
  }
  if (invitation.status === "expired") {
    return (
      <p role="alert">
        This invitation from {invitation.clinicName} has expired. Ask the clinic
        to send a new one.
      </p>
    );
  }
  if (invitation.status === "accepted") {
    return (
      <div className="flex flex-col gap-4">
        <p>
          This invitation from {invitation.clinicName} was already accepted.
        </p>
        <Link href="/clinic" className={buttonVariants({ size: "lg" })}>
          Go to my clinic
        </Link>
      </div>
    );
  }
  if (user.email?.toLowerCase() !== invitation.email) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert">
          This invitation was sent to {invitation.email}, and you are signed in
          as {user.email}. Log out, then sign in with the invited address.
        </p>
        <LogoutButton />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <p>
        {invitation.clinicName} invites you to join as a physio. You will see
        your sessions in your own agenda.
      </p>
      <AcceptForm token={token} clinicName={invitation.clinicName} />
    </div>
  );
}
