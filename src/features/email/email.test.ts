import { describe, expect, it, vi } from "vitest";
import { escapeHtml, renderEmail } from "./layout";

vi.mock("server-only", () => ({}));
const { sendWithResend } = await import("./resend");

describe("renderEmail", () => {
  const email = renderEmail({
    heading: "Your session is confirmed",
    paragraphs: ["Tue 24 Nov at 09:30 with Thomas."],
    action: {
      label: "View my booking",
      url: "https://kinora-booking.vercel.app/x",
    },
    footer: "Maison Tilleul, Rue Exemple 12, 1000 Brussels",
  });

  it("puts every part in the HTML", () => {
    expect(email.html).toContain("Your session is confirmed");
    expect(email.html).toContain("Tue 24 Nov at 09:30 with Thomas.");
    expect(email.html).toContain('href="https://kinora-booking.vercel.app/x"');
  });

  it("has a plain text version with the link written out", () => {
    expect(email.text).toBe(
      [
        "Your session is confirmed",
        "",
        "Tue 24 Nov at 09:30 with Thomas.",
        "",
        "View my booking: https://kinora-booking.vercel.app/x",
        "",
        "Maison Tilleul, Rue Exemple 12, 1000 Brussels",
      ].join("\n"),
    );
  });

  it("escapes what users typed", () => {
    const { html } = renderEmail({
      heading: "Hi",
      paragraphs: ['<script>alert("x")</script> & co'],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; co",
    );
  });

  it("refuses links that are not http or https", () => {
    const { html } = renderEmail({
      heading: "Hi",
      paragraphs: [],
      action: { label: "Open", url: "javascript:alert(1)" },
    });
    expect(html).toContain('href="#"');
  });
});

describe("escapeHtml", () => {
  it("escapes quotes used in attributes", () => {
    expect(escapeHtml(`"'`)).toBe("&quot;&#39;");
  });
});

describe("sendWithResend", () => {
  const email = {
    from: "a@b.co",
    to: "c@d.co",
    subject: "S",
    html: "<p>H</p>",
    text: "H",
  };

  it("sends the idempotency key, so a retry cannot send twice", async () => {
    const fetchImpl = vi.fn(
      async (_url: RequestInfo | URL, _init?: RequestInit) =>
        Response.json({ id: "re_123" }),
    );
    const result = await sendWithResend(email, {
      apiKey: "re_test",
      idempotencyKey: "email-1",
      fetchImpl,
    });
    expect(result).toEqual({ ok: true, id: "re_123" });
    const init = fetchImpl.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get("Idempotency-Key")).toBe("email-1");
  });

  it("reports an API error instead of throwing", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ message: "Invalid `to` field" }, { status: 422 }),
    );
    const result = await sendWithResend(email, {
      apiKey: "re_test",
      idempotencyKey: "email-2",
      fetchImpl,
    });
    expect(result).toEqual({
      ok: false,
      error: "Resend 422: Invalid `to` field",
    });
  });

  it("reports a network failure instead of throwing", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("fetch failed");
    });
    const result = await sendWithResend(email, {
      apiKey: "re_test",
      idempotencyKey: "email-3",
      fetchImpl,
    });
    expect(result).toEqual({ ok: false, error: "fetch failed" });
  });
});
