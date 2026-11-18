# Work log: Spark Scheduler (VSPARK 2026)

Status as of 2026-11-18: **foundation done, app not wired up yet. The branch does not build until step 1 below is done.**

Read first: `docs/PLAN.md` (full plan and requirement map), `docs/design.md` (design system, mandatory),
`new-info.txt` (competition rules and marks). Brief: "1-Hour Challenge, Lightweight AI Social Media Content
Generator & Scheduler" (Gemini captions, Google Drive save/sync + scheduler, feed with edit/delete, email
notifications with customization, Vercel deploy).

## Pick up here (do in order)

1. **Install the missing deps.** The `pnpm add` hung on a slow network and was killed, so `package.json` does not
   list them yet, but the new code imports them:
   ```bash
   pnpm add @supabase/supabase-js @supabase/ssr nodemailer lucide-react
   pnpm add -D @types/nodemailer
   ```
2. **Recreate `.env`** (it is gitignored and was NOT pushed). Copy `.env.example` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL=https://gwsddkdzuztkodpucwcb.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase dashboard > Project Settings > API (or Supabase MCP `get_publishable_keys`)
   - `GEMINI_API_KEY`: the user already has one. Copy it over manually from the old machine's `.env`.
   - Still missing from the user: `GOOGLE_CLIENT_ID/SECRET`, `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`,
     `SMTP_USER/PASS/FROM`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` (any random string).
3. Run `pnpm check`, fix type errors in the new files (none of it has been compiled yet).
4. Build the remaining pieces listed under "Still to build".

## Decisions

- **Stack:** T3 (Next.js 15 App Router, TS, Tailwind v4, tRPC 11, zod, t3-env). No ORM: supabase-js with the user's
  session so RLS enforces ownership.
- **Auth:** Supabase Auth, email/password + Google. Google sign-in requests the `drive.file` scope with
  `access_type=offline` and `prompt=consent`. The auth callback must save `session.provider_refresh_token` into
  `google_tokens`. Drive access tokens are refreshed with GOOGLE_CLIENT_ID/SECRET.
- **Drive:** each post is mirrored as `post-<id>.json` in a Drive folder named "Spark Scheduler". Postgres is the
  source of truth. Drive sync is best effort, and the UI shows a "Synced to Drive" state.
- **Email:** nodemailer over SMTP (Gmail app password works). Reminders sent by a Vercel Cron route.
  Note: Vercel Hobby cron runs at most once per day, so also keep the "Send test email" button for demos.
- **Maps (15 marks in the rules):** tag a location on a post using Places API (New) `places:searchText` on the
  server, show it with a Maps Embed iframe. Handle missing key and API errors in the UI.
- **Storage:** Supabase Storage private bucket `post-media`, files under `<user_id>/...`, signed URLs for display.
- **Design:** `@amplitude/core-ui` is private (404 on npm), so components are rebuilt from the tokens in
  `docs/design.md`. Poppins is used as the documented Gellix substitute (see `--font-gellix` in `globals.css`).
  Copy rules: short, plain, avoid "powerful / seamless / leverage / unlock / game-changing". Do not use or
  recreate the Amplitude logo. Secondary colors never in text. Bold only for display headings.
- **Gemini model:** `gemini-2.5-flash` is retired for new keys (404). Use `gemini-3.8-flash` (default in
  `src/env.js`, verified working). The model returns glued hashtags and extra captions, so
  `src/server/services/gemini.ts` asks for exactly 3 and `cleanHashtags()` splits and limits them.

## Infrastructure that already exists

- **GitHub:** https://github.com/ahmad9059/v-spark-2026 (`main` has the Under Construction page).
- **Vercel:** project `v-spark-2026` in team `ahmad-hassans-projects-118d0bdd` (team id `team_xC7c1Zz7FsyFTNFETBZUjcC4`,
  project id `prj_DyDYhALyVptJeHbcyc6BSufrgxfN`), live at https://v-spark-2026.vercel.app, auto-deploys from `main`.
  **No env vars are set on Vercel yet.**
- **Supabase:** new project `v-spark-2026`, ref `gwsddkdzuztkodpucwcb`, region ap-south-1, free tier. Created through the
  Supabase MCP. The user's other project `codinghawks` is unrelated and was not touched (its tables have RLS off,
  worth telling the user).
- **Database migration `init_schema` is applied** (security advisor clean): tables `posts`,
  `notification_settings`, `google_tokens` with owner-only RLS and `updated_at` triggers; private storage bucket
  `post-media` (5 MB, png/jpeg/webp/gif) with owner-folder policies. If you need it again, read it with
  `list_migrations` or recreate from the column lists in `docs/PLAN.md`.
  - `posts`: id, user_id, prompt, caption (1..2200), hashtags text[], status (`draft|scheduled|sent`), scheduled_at,
    image_path, location jsonb, drive_file_id, reminder_sent_at, created_at, updated_at
  - `notification_settings`: user_id, enabled, email, notify_on_schedule, remind_minutes_before (0..10080), subject,
    include_caption, updated_at
  - `google_tokens`: user_id, refresh_token, updated_at (owner-only RLS, no service key needed for the main flow)

## Done in code (uncompiled, unverified)

- `docs/PLAN.md`
- `src/styles/globals.css`: design tokens (`@theme`) and type scale utilities (`t-title-*`, `t-text-*`, `t-eyebrow-*`)
- `src/env.js`: all env vars, optional ones so builds don't fail; `.env.example` fully documented
- `src/components/ui/`: button (4 variants, 2 sizes, isDanger/isLoading/iconOnly), spinner, field
  (Label/Input/Textarea/FieldHint), card, badge, alert, switch, skeleton, empty, dialog (native `<dialog>`), toast
  (provider + `useToast`)
- `src/lib/cn.ts`, `src/lib/supabase/{client,server,admin}.ts`
- `src/middleware.ts`: session refresh, redirects signed-out users from `/dashboard` to `/login`, signed-in users away
  from `/login` and `/signup`
- `src/server/api/trpc.ts`: context now carries `supabase` and `user`; added `protectedProcedure`; removed the dev delay
- `src/server/services/gemini.ts` (caption generation + error mapping), `drive.ts` (token refresh, folder, upsert,
  delete), `mailer.ts` (nodemailer, HTML email, test/scheduled/reminder kinds)

## Still to build

1. **Providers:** `src/app/layout.tsx`: load Poppins with `next/font/google` (variable `--font-poppins`), wrap in
   `ToastProvider` next to `TRPCReactProvider`.
2. **tRPC routers** in `src/server/api/routers/` and register in `root.ts` (delete the demo `post.ts`):
   - `ai.generate` (input: prompt, platform, tone) -> `generateCaptions`
   - `post`: `list` (add signed image URLs), `create`, `update`, `delete`; each syncs Drive best effort and returns
     `driveSynced` / `driveError`; `create` with a time sends the "scheduled" email when settings allow
   - `settings`: `get` (upsert defaults using the user's email), `update`, `sendTest`
   - `drive`: `status` (connected or not), `syncAll`
   - `places.search` (Places API New, field mask `places.id,places.displayName,places.formattedAddress,places.location`)
   - Validate every input with zod. Map upstream failures to clear `TRPCError` messages.
3. **Auth pages:** `/login`, `/signup` (email/password + "Continue with Google"), `/auth/callback/route.ts`
   (exchange code, save `provider_refresh_token` to `google_tokens`, redirect to `next`), logout action.
   Add a "Connect Google Drive" button for email users.
4. **`/dashboard`** (single page, protected): Generator -> 3 caption cards -> pick one -> Schedule dialog (date/time,
   optional image upload to Storage, optional Maps location) -> Feed (edit text, delete, status badge, Drive
   badge, thumbnail) -> Notification settings panel (enabled, email, on-schedule, remind minutes before, subject,
   include caption, send test). Empty, loading (skeleton) and error states for each.
5. **Landing page `/`:** replace the Under Construction page (header, hero, CTA to sign up) using the design system.
6. **Cron:** `src/app/api/cron/reminders/route.ts` (check `Authorization: Bearer $CRON_SECRET`, admin client, send due
   reminders, set `reminder_sent_at`, mark past posts `sent`) and `vercel.json` with a daily schedule.
7. **Supabase config (dashboard, user must do):** Auth > Providers > Google (client id/secret), add the redirect URL
   `https://gwsddkdzuztkodpucwcb.supabase.co/auth/v1/callback` in Google Cloud, and under Auth > URL Configuration add the
   site URL `https://v-spark-2026.vercel.app` and `http://localhost:3000/**`. Google Cloud: enable Drive API, add the
   `drive.file` scope, add the user's email as a test user.
8. **Deploy:** set all env vars on Vercel (Vercel MCP `create_project_env`, never print secrets), merge to `main`,
   confirm the deployment is READY, test sign-up, generate, schedule, edit, delete, upload, map, email, Drive on the
   live URL.
9. **README** (required, 5 marks): `.env.example` descriptions, setup steps, architecture, API keys needed,
   technologies, deployment details, and **screenshots of every process** (auth, CRUD, upload, API, deployed app).
   Use Playwright to capture them. Add student name, registration number, GitHub URL, live URL, Drive location.
10. Final checks: `pnpm check`, `pnpm build`, no secrets in git, GitHub and Google Drive copies identical.

## Competition rules to keep in mind

120 minutes total. Marks: UI/UX 10, Auth 15 (register, login, logout, protected routes), DB CRUD 20, Storage 10,
External API 15 (Google Maps named in the rules; Gemini also counts), Deployment 15, Code quality 5, Docs 5, Demo 5.
Never commit `.env`. Judges may test everything live.

## Notes

- Not committed on purpose: `competition.md` (personal cheat sheet), `.kiro/`, `.env`.
- This work is on branch `wip/build-app`, not `main`. `main` is the Vercel production branch, and this branch does
  not build yet, so merging it early would cause a failed production deploy (the live Under Construction page
  would stay up, but the deploy would show as failed). Merge to `main` once `pnpm build` passes.
- If `pnpm add` is slow again, the registry was the problem (requests took 100+ seconds). Retry or use a
  different network on the VPS.
