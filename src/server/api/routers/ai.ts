import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { generateCaptions } from "~/server/services/gemini";

export const PLATFORMS = ["Instagram", "X", "LinkedIn", "Facebook", "TikTok"] as const;
export const TONES = ["Friendly", "Professional", "Playful", "Bold"] as const;

export const aiRouter = createTRPCRouter({
  generate: protectedProcedure
    .input(
      z.object({
        prompt: z.string().trim().min(3, "Write a few words about your post.").max(500),
        platform: z.enum(PLATFORMS).default("Instagram"),
        tone: z.enum(TONES).default("Friendly"),
      }),
    )
    .mutation(async ({ input }) => ({ captions: await generateCaptions(input) })),
});
