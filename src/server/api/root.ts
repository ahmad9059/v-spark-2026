import { aiRouter } from "~/server/api/routers/ai";
import { driveRouter } from "~/server/api/routers/drive";
import { postRouter } from "~/server/api/routers/post";
import { settingsRouter } from "~/server/api/routers/settings";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  ai: aiRouter,
  post: postRouter,
  settings: settingsRouter,
  drive: driveRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
