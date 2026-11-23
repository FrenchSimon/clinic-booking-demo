import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { AcceptForm } from "@/features/invitations/components/accept-form";
import { previewInvitation } from "@/features/invitations/preview";
import { TOKEN_PATTERN } from "@/features/invitations/schema";
import { fill } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";
import { getUser } from "@/server/auth";

// Landing page of the invitation email. Nothing about the clinic is shown
// before sign-in: the token alone never reveals data to an anonymous visitor.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.auth.invite.title}${t.meta.suffix}` };
}

export default async function InvitePage({
  params,
}: PageProps<"/[lang]/invite/[token]">) {
  const { t } = await getDictionary();
  return (
    <AuthShell title={t.auth.invite.title}>
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
  const { t } = await getDictionary();
  const s = t.auth.invite;

  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        <p>{s.signedOut}</p>
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className={buttonVariants({ size: "lg" })}
        >
          {s.createAccount}
        </Link>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          {s.haveAccount}
        </Link>
      </div>
    );
  }

  const invitation = await previewInvitation(user.id, token);
  if (!invitation) {
    return <p role="alert">{s.notValid}</p>;
  }
  if (invitation.status === "expired") {
    return (
      <p role="alert">{fill(s.expired, { clinic: invitation.clinicName })}</p>
    );
  }
  if (invitation.status === "accepted") {
    return (
      <div className="flex flex-col gap-4">
        <p>{fill(s.accepted, { clinic: invitation.clinicName })}</p>
        <Link href="/clinic" className={buttonVariants({ size: "lg" })}>
          {s.goToClinic}
        </Link>
      </div>
    );
  }
  if (user.email?.toLowerCase() !== invitation.email) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert">
          {fill(s.otherEmail, {
            invited: invitation.email,
            current: user.email ?? "",
          })}
        </p>
        <LogoutButton />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <p>{fill(s.open, { clinic: invitation.clinicName })}</p>
      <AcceptForm
        token={token}
        clinicName={invitation.clinicName}
        t={{ join: s.join, joining: s.joining }}
      />
    </div>
  );
}
