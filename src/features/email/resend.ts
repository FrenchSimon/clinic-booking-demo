import "server-only";

// Resend's REST API, called with fetch: no SDK needed for one endpoint.
// https://resend.com/docs/api-reference/emails/send-email

export type OutgoingEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendWithResend(
  email: OutgoingEmail,
  options: { apiKey: string; idempotencyKey: string; fetchImpl?: typeof fetch },
): Promise<SendResult> {
  const doFetch = options.fetchImpl ?? fetch;
  try {
    const response = await doFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
        // Resend drops a second request with the same key for 24 hours:
        // a retry after a timeout cannot send the email twice.
        "Idempotency-Key": options.idempotencyKey,
      },
      body: JSON.stringify(email),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };
    if (!response.ok || !body.id) {
      return {
        ok: false,
        error: `Resend ${response.status}: ${body.message ?? "no message"}`,
      };
    }
    return { ok: true, id: body.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
