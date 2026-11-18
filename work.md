# Work log: Spark Scheduler (VSPARK 2026)

Status as of 2026-11-18: **app is built and works locally. Not merged to `main` yet, so the live site still shows
Under Construction.** Branch: `wip/build-app`.

Read first: `docs/PLAN.md` (plan and requirement map), `docs/design.md` (design system, mandatory),
`new-info.txt` (competition rules and marks). Brief: "1-Hour Challenge, Lightweight AI Social Media Content
Generator & Scheduler".

## Setup on a new machine

```bash
git clone -b wip/build-app https://github.com/ahmad9059/v-spark-2026.git && cd v-spark-2026
pnpm install            # the npm registry was very slow on the first machine; retry if it stalls
cp .env.example .env    # then fill in (see below). .env is gitignored.
pnpm dev                # check which port it prints, 3000 may be taken
```

`.env` values live only on the original machine and in Vercel (sensitive vars can't be read back). Re-create them from
the Supabase / Google Cloud / Gmail dashboards, or copy `.env` over by hand. Never commit it.

## What works (tested live in a browser on localhost)

- Landing, sign-in, sign-up pages. Email/password sign-in. Signed-out users are redirected from `/dashboard` to `/login`.
- Gemini captions: 3 captions with clean hashtags in about 2 s.
- Posts: create / schedule / edit / delete. Saved in Supabase Postgres, owner-only RLS verified (anon key sees nothing).
- Image upload to Supabase Storage (private bucket, signed URLs). Deleting a post removes the file.
- Notification settings dialog saves and persists.
- Cron route `/api/cron/reminders`: 401 without the secret; with it, sent a real SMTP email, stamped
  `reminder_sent_at`, and did not resend on the second run.
- `pnpm check` clean, `pnpm build` passes.
- Screenshots in `docs/screenshots/` (landing, login, dashboard, captions, schedule dialog, feed, edit, settings, delete).

## Not tested yet

- **Google Drive sync and Google sign-in.** `GOOGLE_CLIENT_ID/SECRET` are set, but the Supabase Google provider
  was OFF when last checked (`/auth/v1/settings` showed `google: false`). It must be enabled in the Supabase
  dashboard, then test: sign in with Google, check a row appears in `google_tokens`, create a post, check the
  "Spark Scheduler" folder and `post-<id>.json` appear in Drive, edit and delete follow.
- Sign-up with email (Supabase has "Confirm email" on and the built-in mailer allows about 2 emails/hour; turn it
  off in Authentication > Sign In / Providers > Email so judges can register).
- Mobile layout check.
- Scheduled-post email sent at schedule time (only the cron/reminder path and the settings test were verified).

## Infrastructure

- **GitHub:** https://github.com/ahmad9059/v-spark-2026. `main` = Under Construction page. `wip/build-app` = the app.
- **Vercel:** project `v-spark-2026`, team `ahmad-hassans-projects-118d0bdd` (`team_xC7c1Zz7FsyFTNFETBZUjcC4`), project id
  `prj_DyDYhALyVptJeHbcyc6BSufrgxfN`, https://v-spark-2026.vercel.app, auto-deploys from `main`.
  Env vars set (production + preview): Supabase URL and publishable key, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`,
  `GOOGLE_CLIENT_ID/SECRET`, `SMTP_HOST/PORT/USER/PASS/FROM`, `CRON_SECRET`.
  `vercel.json` has a daily cron (Hobby plan limit).
- **Supabase:** project `v-spark-2026`, ref `gwsddkdzuztkodpucwcb`, ap-south-1, free. Migration `init_schema` applied
  (tables `posts`, `notification_settings`, `google_tokens`, bucket `post-media`, RLS on, advisor clean).
  The user's other project `codinghawks` is unrelated and untouched (its 8 tables have RLS off).
- **Test user to delete before submission:** `qa.tester@sparktest.dev` in Supabase Auth (created by SQL for testing).

## Decisions

- T3 stack (Next.js 15, TS, Tailwind v4, tRPC 11, zod, t3-env). No ORM: supabase-js with the user session + RLS.
- Auth: Supabase Auth, email/password + Google (`drive.file` scope, offline access). `/auth/callback` saves
  `provider_refresh_token` to `google_tokens`; Drive access tokens are refreshed with the Google client id/secret.
- Drive: each post mirrored as `post-<id>.json` in a "Spark Scheduler" folder. Postgres is the source of truth;
  Drive sync is best effort and the UI toasts the reason when it is skipped.
- Email: nodemailer SMTP (Gmail app password). Vercel Hobby cron runs once a day, so demo emails with the
  "Send test email" button.
- **Google Maps was removed on the user's request** (location search, map preview, `posts.location` column dropped via
  migration `drop_posts_location`). The rules mention Maps for the External API criterion (15 marks); Gemini is now the
  only external API. Say so in the README and demo, or add another API if judges insist on Maps.
- Design: `@amplitude/core-ui` is private, so components are rebuilt from `docs/design.md` tokens. Poppins is the
  documented Gellix substitute. Copy avoids "powerful / seamless / leverage / unlock". No Amplitude logo.
- Gemini: `gemini-2.5-flash` is retired for new keys. `gemini-3.8-flash` works but takes about 20 s (it thinks).
  Default is `gemini-3.5-flash-lite` (about 2 s). The model sometimes glues hashtags together, so
  `cleanHashtags()` in `src/server/services/gemini.ts` splits and limits them.

## Gotchas found

- No nested `<form>` elements (a nested form once submitted the post). Never put real values in `.env.example`:
  GitHub push protection blocked a commit that had real Google/SMTP credentials in it.
- zsh: write `${m}:generateContent`, not `$m:generateContent` (zsh treats `:g` as a modifier).
- Playwright MCP can only write screenshots inside the project dir (`docs/screenshots/`).
- Next dev picks the next free port if 3000 is taken. Check which port it printed.

## Remaining, in order

1. Enable the Supabase Google provider, then run the Drive test above.
2. Turn off "Confirm email" in Supabase, test sign-up.
3. Merge `wip/build-app` into `main`, watch the Vercel build, test the live URL end to end.
4. README (required): env var table, setup steps, architecture, technologies, API keys needed, deployment,
   screenshots of each process, student name, registration number, GitHub URL, live URL, Drive location.
5. Delete the QA test user. Confirm no secrets in git. Google Drive copy must equal GitHub.

## Competition rules to keep in mind

120 minutes. Marks: UI/UX 10, Auth 15, DB CRUD 20, Storage 10, External API 15 (Gemini; Maps removed),
Deployment 15, Code quality 5, Docs 5, Demo 5. Never commit `.env`. Judges test everything live.
