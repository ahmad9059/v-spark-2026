import "server-only";

import { type SupabaseClient } from "@supabase/supabase-js";

import {
  DriveError,
  deletePostFile,
  refreshAccessToken,
  upsertPostFile,
  type DrivePost,
} from "~/server/services/drive";
import {
  mailConfigured,
  sendPostEmail,
  type MailPost,
  type MailSettings,
} from "~/server/services/mailer";

export type PostRow = DrivePost & {
  user_id: string;
  prompt: string;
  image_path: string | null;
  drive_file_id: string | null;
  reminder_sent_at: string | null;
};

export type SettingsRow = MailSettings & {
  user_id: string;
  enabled: boolean;
  notify_on_schedule: boolean;
  remind_minutes_before: number;
};

export type SyncResult = { driveSynced: boolean; driveError: string | null };

async function accessTokenFor(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("google_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .maybeSingle<{ refresh_token: string }>();
  if (!data) throw new DriveError("Google Drive is not connected.");
  return refreshAccessToken(data.refresh_token);
}

export async function isDriveConnected(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("google_tokens")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/** Best effort: a Drive failure never blocks saving the post. */
export async function syncPostToDrive(
  supabase: SupabaseClient,
  post: PostRow,
): Promise<SyncResult> {
  try {
    const token = await accessTokenFor(supabase, post.user_id);
    const fileId = await upsertPostFile(token, post, post.drive_file_id);
    if (fileId !== post.drive_file_id) {
      await supabase.from("posts").update({ drive_file_id: fileId }).eq("id", post.id);
    }
    return { driveSynced: true, driveError: null };
  } catch (e) {
    return {
      driveSynced: false,
      driveError: e instanceof Error ? e.message : "Drive sync failed.",
    };
  }
}

export async function removePostFromDrive(
  supabase: SupabaseClient,
  userId: string,
  fileId: string | null,
) {
  if (!fileId) return;
  try {
    const token = await accessTokenFor(supabase, userId);
    await deletePostFile(token, fileId);
  } catch {
    // The row is already gone. A stray Drive file is not worth failing the delete.
  }
}

export async function getSettings(
  supabase: SupabaseClient,
  userId: string,
  fallbackEmail: string,
): Promise<SettingsRow> {
  const { data } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<SettingsRow>();
  if (data) return data;

  const { data: created, error } = await supabase
    .from("notification_settings")
    .insert({ user_id: userId, email: fallbackEmail })
    .select("*")
    .single<SettingsRow>();
  if (error) throw error;
  return created;
}

/** Returns an error message, or null when sent or skipped by the user's settings. */
export async function notifyScheduled(
  settings: SettingsRow,
  post: MailPost,
): Promise<string | null> {
  if (!settings.enabled || !settings.notify_on_schedule) return null;
  if (!mailConfigured()) return "Email is not set up on the server.";
  try {
    await sendPostEmail({ settings, post, kind: "scheduled" });
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "Email failed.";
  }
}
