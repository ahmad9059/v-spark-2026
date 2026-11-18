import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { mailConfigured, sendPostEmail } from "~/server/services/mailer";
import { getSettings } from "~/server/services/sync";

export const settingsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const s = await getSettings(ctx.supabase, ctx.user.id, ctx.user.email ?? "");
    return {
      enabled: s.enabled,
      email: s.email,
      notifyOnSchedule: s.notify_on_schedule,
      remindMinutesBefore: s.remind_minutes_before,
      subject: s.subject,
      includeCaption: s.include_caption,
      mailReady: mailConfigured(),
    };
  }),

  update: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        email: z.string().trim().email("Enter a valid email."),
        notifyOnSchedule: z.boolean(),
        remindMinutesBefore: z.number().int().min(0).max(10080),
        subject: z.string().trim().min(1, "Add a subject.").max(120),
        includeCaption: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getSettings(ctx.supabase, ctx.user.id, ctx.user.email ?? "");
      const { error } = await ctx.supabase
        .from("notification_settings")
        .update({
          enabled: input.enabled,
          email: input.email,
          notify_on_schedule: input.notifyOnSchedule,
          remind_minutes_before: input.remindMinutesBefore,
          subject: input.subject,
          include_caption: input.includeCaption,
        })
        .eq("user_id", ctx.user.id);
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return { ok: true };
    }),

  sendTest: protectedProcedure.mutation(async ({ ctx }) => {
    const settings = await getSettings(ctx.supabase, ctx.user.id, ctx.user.email ?? "");
    try {
      await sendPostEmail({
        settings,
        kind: "test",
        post: {
          caption: "Coffee is ready. Come say hi.",
          hashtags: ["#coffee", "#morning"],
          scheduled_at: new Date(Date.now() + 3_600_000).toISOString(),
          location: null,
        },
      });
    } catch (e) {
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: e instanceof Error ? e.message : "Could not send the email.",
      });
    }
    return { sentTo: settings.email };
  }),
});
