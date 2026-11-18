import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  isDriveConnected,
  syncPostToDrive,
  type PostRow,
} from "~/server/services/sync";

export const driveRouter = createTRPCRouter({
  status: protectedProcedure.query(async ({ ctx }) => ({
    connected: await isDriveConnected(ctx.supabase, ctx.user.id),
  })),

  syncAll: protectedProcedure.mutation(async ({ ctx }) => {
    const { data } = await ctx.supabase
      .from("posts")
      .select("*")
      .returns<PostRow[]>();
    let synced = 0;
    let error: string | null = null;
    for (const post of data ?? []) {
      const r = await syncPostToDrive(ctx.supabase, post);
      if (r.driveSynced) synced++;
      else error ??= r.driveError;
    }
    return { synced, total: data?.length ?? 0, error };
  }),
});
