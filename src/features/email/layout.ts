// One layout for every email, in the colors of DESIGN.md. Plain inline styles
// and tables: email clients ignore stylesheets and modern CSS.

import type { Locale } from "@/i18n/locale";

export type EmailContent = {
  /** Shown as the email's title and in the subject line. */
  heading: string;
  paragraphs: string[];
  action?: { label: string; url: string };
  /** Small print, for example the clinic's address. */
  footer?: string;
  /** The language it is written in, for <html lang>. English by default. */
  locale?: Locale;
};

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Everything that comes from users (names, addresses) goes through here. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);
}

function safeUrl(url: string): string {
  return /^https?:\/\//.test(url) ? url : "#";
}

export function renderEmail(content: EmailContent): {
  html: string;
  text: string;
} {
  const paragraphs = content.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1e2b24">${escapeHtml(p)}</p>`,
    )
    .join("");
  const action = content.action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(safeUrl(content.action.url))}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#2f5d46;color:#ffffff;font-weight:600;text-decoration:none">${escapeHtml(content.action.label)}</a></p>`
    : "";
  const footer = content.footer
    ? `<p style="margin:24px 0 0;font-size:13px;color:#4a524c">${escapeHtml(content.footer)}</p>`
    : "";

  const html = `<!doctype html><html lang="${content.locale ?? "en"}"><body style="margin:0;background:#f7f3eb;font-family:Inter,Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3eb"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #ddd3c2;border-radius:18px"><tr><td style="padding:32px"><p style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px;font-weight:600;color:#2f5d46">Kinora</p><h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1e2b24">${escapeHtml(content.heading)}</h1>${paragraphs}${action}${footer}</td></tr></table></td></tr></table></body></html>`;

  const text = [
    content.heading,
    "",
    ...content.paragraphs.flatMap((p) => [p, ""]),
    ...(content.action
      ? [`${content.action.label}: ${content.action.url}`, ""]
      : []),
    ...(content.footer ? [content.footer] : []),
  ]
    .join("\n")
    .trim();

  return { html, text };
}
