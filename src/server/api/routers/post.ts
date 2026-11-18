import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  getSettings,
  notifyScheduled,
  removePostFromDrive,
  syncPostToDrive,
  type PostRow,
} from "~/server/services/sync";

const caption = z.string().trim().min(1, "Caption can't be empty.").max(2200);
const hashtags = z.array(z.string().max(40)).max(15);
const scheduledAt = z
  .string()
  .datetime()
  .nullable()
  .refine((v) => v === null || new Date(v).getTime() > Date.now() - 60_000, {
    message: "Pick a time in the future.",
  });

const imagePath = z.string().max(300).nullable();

const columns =
  "id,user_id,prompt,caption,hashtags,status,scheduled_at,image_path,drive_file_id,reminder_sent_at,created_at,updated_at";

export const postRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("posts")
      .select(columns)
      .order("created_at", { ascending: false })
      .returns<PostRow[]>();
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

    const paths = data.map((p) => p.image_path).filter((p): p is string => Boolean(p));
    const urls = new Map<string, string>();
    if (paths.length) {
      const { data: signed } = await ctx.supabase.storage
        .from("post-media")
        .createSignedUrls(paths, 3600);
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
      }
    }
    return data.map((p) => ({
      ...p,
      imageUrl: p.image_path ? (urls.get(p.image_path) ?? null) : null,
    }));
  }),

  create: protectedProcedure
    .input(
      z.object({
        prompt: z.string().max(500).default(""),
        caption,
        hashtags,
        scheduledAt,
        imagePath,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("posts")
        .insert({
          user_id: ctx.user.id,
          prompt: input.prompt,
          caption: input.caption,
          hashtags: input.hashtags,
          status: input.scheduledAt ? "scheduled" : "draft",
          scheduled_at: input.scheduledAt,
          image_path: input.imagePath,
        })
        .select(columns)
        .single<PostRow>();
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

      const sync = await syncPostToDrive(ctx.supabase, data);

      let emailError: string | null = null;
      if (input.scheduledAt) {
        const settings = await getSettings(ctx.supabase, ctx.user.id, ctx.user.email ?? "");
        emailError = await notifyScheduled(settings, data);
      }
      return { id: data.id, ...sync, emailError };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        caption: caption.optional(),
        hashtags: hashtags.optional(),
        scheduledAt: scheduledAt.optional(),
        imagePath: imagePath.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const patch: Record<string, unknown> = {};
      if (input.caption !== undefined) patch.caption = input.caption;
      if (input.hashtags !== undefined) patch.hashtags = input.hashtags;
      if (input.imagePath !== undefined) patch.image_path = input.imagePath;
      if (input.scheduledAt !== undefined) {
        patch.scheduled_at = input.scheduledAt;
        patch.status = input.scheduledAt ? "scheduled" : "draft";
        patch.reminder_sent_at = null;
      }
      if (Object.keys(patch).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nothing to update." });
      }

      const { data, error } = await ctx.supabase
        .from("posts")
        .update(patch)
        .eq("id", input.id)
        .select(columns)
        .single<PostRow>();
      if (error) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found." });

      return syncPostToDrive(ctx.supabase, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("posts")
        .delete()
        .eq("id", input.id)
        .select("drive_file_id,image_path")
        .maybeSingle<{ drive_file_id: string | null; image_path: string | null }>();
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found." });

      if (data.image_path) {
        await ctx.supabase.storage.from("post-media").remove([data.image_path]);
      }
      await removePostFromDrive(ctx.supabase, ctx.user.id, data.drive_file_id);
      return { ok: true };
    }),
});
