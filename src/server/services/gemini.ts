import "server-only";

import { TRPCError } from "@trpc/server";

import { env } from "~/env";

export type Caption = { text: string; hashtags: string[] };

export type GenerateInput = {
  prompt: string;
  platform: string;
  tone: string;
};

export function cleanHashtags(raw: string[]): string[] {
  const out: string[] = [];
  for (const item of raw) {
    // The model sometimes glues several tags into one string.
    for (const part of item.split(/(?=#)|[\s,]+/)) {
      const word = part.replace(/[^\p{L}\p{N}_]/gu, "");
      if (!word || word.length > 24) continue;
      const tag = `#${word}`;
      if (!out.some((t) => t.toLowerCase() === tag.toLowerCase())) out.push(tag);
    }
  }
  return out.slice(0, 6);
}

export async function generateCaptions(input: GenerateInput): Promise<Caption[]> {
  if (!env.GEMINI_API_KEY) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Gemini is not set up. Add GEMINI_API_KEY.",
    });
  }

  const instruction = [
    `Write exactly 3 different ${input.platform} captions for this post idea.`,
    `Tone: ${input.tone}.`,
    "Each caption is 1 to 3 short sentences, ready to paste. No hashtags inside the caption text.",
    "Each caption also gets 4 to 6 hashtags. Every hashtag is ONE word or short phrase, no spaces, under 20 characters, starting with #.",
    `Post idea: """${input.prompt}"""`,
  ].join("\n");

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: instruction }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                captions: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      text: { type: "STRING" },
                      hashtags: { type: "ARRAY", items: { type: "STRING" } },
                    },
                    required: ["text", "hashtags"],
                  },
                },
              },
              required: ["captions"],
            },
          },
        }),
        signal: AbortSignal.timeout(45_000),
      },
    );
  } catch {
    throw new TRPCError({
      code: "TIMEOUT",
      message: "Gemini took too long. Try again.",
    });
  }

  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    console.error("Gemini error", res.status, detail?.error?.message);
    const message =
      res.status === 429
        ? "Gemini is busy right now. Wait a minute and try again."
        : res.status === 400 || res.status === 403
          ? "Gemini rejected the request. Check the API key."
          : res.status === 404
            ? "That Gemini model is not available. Check GEMINI_MODEL."
            : "Gemini had a problem. Try again.";
    throw new TRPCError({ code: "BAD_GATEWAY", message });
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;

  try {
    const parsed = JSON.parse(text ?? "") as { captions?: Caption[] };
    const captions = (parsed.captions ?? [])
      .filter((c) => typeof c.text === "string" && c.text.trim())
      .slice(0, 3)
      .map((c) => ({
        text: c.text.trim(),
        hashtags: cleanHashtags(Array.isArray(c.hashtags) ? c.hashtags : []),
      }));
    if (captions.length === 0) throw new Error("empty");
    return captions;
  } catch {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Gemini sent back something we could not read. Try again.",
    });
  }
}
