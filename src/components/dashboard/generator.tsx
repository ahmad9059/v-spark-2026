"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { type Draft } from "~/components/dashboard/post-dialog";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Label, Select, Textarea } from "~/components/ui/field";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

const PLATFORMS = ["Instagram", "X", "LinkedIn", "Facebook", "TikTok"] as const;
const TONES = ["Friendly", "Professional", "Playful", "Bold"] as const;

export function Generator({ onPick }: { onPick: (d: Draft) => void }) {
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("Instagram");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Friendly");
  const gen = api.ai.generate.useMutation();

  return (
    <section aria-labelledby="gen-title">
      <p className="t-eyebrow-m">Step 1</p>
      <h2 id="gen-title" className="t-title-s mt-1">
        What's the post about?
      </h2>

      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          gen.mutate({ prompt, platform, tone });
        }}
      >
        <div>
          <Label htmlFor="prompt">Your idea</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={500}
            placeholder="We open a new coffee shop in Vehari this Friday"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="platform">Platform</Label>
            <Select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as typeof platform)}
            >
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="tone">Tone</Label>
            <Select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value as typeof tone)}
            >
              {TONES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </div>
        </div>
        <Button type="submit" isLoading={gen.isPending} className="w-full sm:w-auto">
          <Sparkles className="size-4" aria-hidden />
          Write 3 captions
        </Button>
      </form>

      <div className="mt-6 space-y-3" aria-live="polite">
        {gen.error ? <Alert tone="danger">{gen.error.message}</Alert> : null}
        {gen.isPending
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)
          : null}
        {gen.data?.captions.map((c, i) => (
          <Card key={i} className="p-4">
            <p className="t-text-m whitespace-pre-wrap text-black">{c.text}</p>
            <p className="t-text-s mt-2 text-blue">{c.hashtags.join(" ")}</p>
            <div className="mt-3 flex justify-end">
              <Button
                size="small"
                onClick={() => onPick({ caption: c.text, hashtags: c.hashtags, prompt })}
              >
                Use this one
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
