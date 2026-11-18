# Plan: AI Social Content Generator & Scheduler

Brief: `1 hour Problem_Statement.pdf` + rules in `new-info.txt` + design in `docs/design.md`.

## What we build

A creator signs in, types a prompt, gets 2–3 Gemini captions with hashtags, picks one, schedules it, and it is
saved to the database **and** synced to their Google Drive. A feed lists all posts (edit text, delete).
Email notifications go out per scheduled post, and the user controls how.

## Requirement map

| Brief / rule                                  | How we cover it                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| AI captions (2–3 + hashtags)                  | tRPC `ai.generate` -> Gemini REST, JSON schema output, server-side key         |
| Google Drive storage + scheduler              | Google OAuth (`drive.file`), each post mirrored as a JSON file in a Drive folder |
| Feed with edit / delete                       | tRPC `post.*` CRUD on Supabase Postgres (RLS), Drive file updated/deleted too   |
| Email notifications + customization           | Nodemailer (SMTP). `settings.*` per user: on/off, address, lead time, subject, body options. Vercel Cron sends reminders. "Send test" button |
| Auth (15)                                     | Supabase Auth: email/password + Google. Protected `/dashboard`, logout          |
| Database CRUD (20)                            | Supabase Postgres, tables `posts`, `notification_settings`, `google_tokens`     |
| Cloud storage (10)                            | Supabase Storage bucket `post-media` (private, signed URLs) for post images     |
| External API (15)                             | Gemini (captions), with error handling and clear messages. Google Maps was dropped by the user |
| Deployment (15)                               | Vercel (project already linked to GitHub `main`)                                |
| UI/UX + responsive (10)                       | Amplitude design system tokens, mobile first                                    |
| Code quality (5)                              | zod validation on every input, typed tRPC, error toasts                         |
| Docs (5)                                      | README with env table, setup, architecture, screenshots                         |

## Stack

T3: Next.js 15 App Router, TypeScript, Tailwind v4, tRPC 11, zod, `@t3-oss/env-nextjs`.
Added: `@supabase/ssr`, `@supabase/supabase-js`, `nodemailer`, `lucide-react`.
No ORM: supabase-js with the user's session so Row Level Security enforces ownership.

## Design system

`@amplitude/core-ui` is private (not on npm), so we rebuild the components we need in `src/components/ui`
from the tokens in `docs/design.md`: Blue `#0052F2`, black/white lead, grays, 8px radius buttons
(primary/secondary/tertiary/tertiary-alt, medium 32px / small 24px), type scale. Gellix is licensed, so we use
the documented Google substitute, Poppins, exposed as `font-gellix`. Copy follows the voice rules (short,
plain, no "powerful/seamless/leverage"). We do not reuse the Amplitude logo; the app has its own text wordmark.

## Data model

- `posts`: id, user_id, prompt, caption, hashtags[], status (`draft|scheduled|sent`), scheduled_at,
  image_path, drive_file_id, reminder_sent_at, timestamps
- `notification_settings`: user_id, enabled, email, notify_on_schedule, remind_minutes_before, subject, include_caption
- `google_tokens`: user_id, refresh_token (service-role only, no client policy)

## Milestones

1. Foundation: deps, env, design tokens, UI kit, Supabase clients, SQL migration
2. Auth: signup/login/Google, callback (stores Drive tokens), middleware route protection
3. Generator: Gemini route + UI
4. Posts: CRUD, schedule dialog, Drive sync, image upload, Maps location
5. Notifications: settings UI, mailer, cron, test send
6. Polish, README + screenshots, env on Vercel, deploy, verify

## What we need from the user (cannot be created by the agent)

Supabase project (URL, anon key, service role key), Google Cloud OAuth client (Drive API enabled, same client in
Supabase Google provider), Gemini API key, SMTP credentials (Gmail app password works).
