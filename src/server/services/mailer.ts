import "server-only";

import nodemailer from "nodemailer";

import { env } from "~/env";

export type MailPost = {
  caption: string;
  hashtags: string[];
  scheduled_at: string | null;
};

export type MailSettings = {
  email: string;
  subject: string;
  include_caption: boolean;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function mailConfigured() {
  return Boolean(env.SMTP_USER && env.SMTP_PASS);
}

export async function sendPostEmail(opts: {
  settings: MailSettings;
  post: MailPost;
  kind: "scheduled" | "reminder" | "test";
}) {
  if (!mailConfigured()) {
    throw new Error("Email is not set up. Add SMTP_USER and SMTP_PASS.");
  }
  const { settings, post, kind } = opts;

  const when = post.scheduled_at
    ? new Date(post.scheduled_at).toUTCString().replace("GMT", "UTC")
    : "No time set";
  const intro =
    kind === "scheduled"
      ? "You scheduled a post."
      : kind === "reminder"
        ? "A post is due soon."
        : "This is a test email from your notification settings.";
  const caption = settings.include_caption
    ? `<p style="margin:16px 0;padding:16px;background:#F2F4F8;border-radius:8px;white-space:pre-wrap">${esc(post.caption)}<br><br><span style="color:#0052F2">${esc(post.hashtags.join(" "))}</span></p>`
    : "";

  const html = `<div style="font-family:Poppins,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#000">
<p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:.05em;color:#0052F2;text-transform:uppercase">Spark Scheduler</p>
<h1 style="margin:0 0 12px;font-size:22px">${esc(settings.subject)}</h1>
<p style="margin:0 0 8px">${intro}</p>
<p style="margin:0 0 8px;color:#697077">Scheduled for: ${esc(when)}</p>${caption}
</div>`;

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  await transport.sendMail({
    from: env.SMTP_FROM ?? env.SMTP_USER,
    to: settings.email,
    subject: kind === "test" ? `[Test] ${settings.subject}` : settings.subject,
    html,
    text: `${settings.subject}\n${intro}\nScheduled for: ${when}\n\n${settings.include_caption ? `${post.caption}\n${post.hashtags.join(" ")}` : ""}`,
  });
}
