import { NextResponse, type NextRequest } from "next/server";

import { env } from "~/env";
import { createAdminClient } from "~/lib/supabase/admin";
import { mailConfigured, sendPostEmail } from "~/server/services/mailer";
import { type PostRow, type SettingsRow } from "~/server/services/sync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 500 });
  }

  const supabase = createAdminClient();
  const now = Date.now();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "scheduled")
    .returns<PostRow[]>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = [...new Set((posts ?? []).map((p) => p.user_id))];
  const { data: settingsRows } = userIds.length
    ? await supabase
        .from("notification_settings")
        .select("*")
        .in("user_id", userIds)
        .returns<SettingsRow[]>()
    : { data: [] as SettingsRow[] };
  const settings = new Map((settingsRows ?? []).map((s) => [s.user_id, s]));

  let sent = 0;
  let failed = 0;
  const finished: string[] = [];

  for (const post of posts ?? []) {
    if (!post.scheduled_at) continue;
    const due = new Date(post.scheduled_at).getTime();
    const s = settings.get(post.user_id);

    if (s?.enabled && !post.reminder_sent_at && mailConfigured()) {
      const remindAt = due - s.remind_minutes_before * 60_000;
      if (remindAt <= now) {
        try {
          await sendPostEmail({
            settings: s,
            kind: "reminder",
            post,
          });
          await supabase
            .from("posts")
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq("id", post.id);
          sent++;
        } catch (e) {
          failed++;
          console.error("Reminder failed", post.id, e);
        }
      }
    }
    if (due <= now) finished.push(post.id);
  }

  if (finished.length) {
    await supabase.from("posts").update({ status: "sent" }).in("id", finished);
  }

  return NextResponse.json({ checked: posts?.length ?? 0, sent, failed, markedSent: finished.length });
}
