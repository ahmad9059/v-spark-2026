"use client";

import { ImagePlus, X } from "lucide-react";
import { useState } from "react";

import { LocationPicker, type Place } from "~/components/dashboard/location-picker";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Dialog } from "~/components/ui/dialog";
import { FieldHint, Input, Label, Textarea } from "~/components/ui/field";
import { useToast } from "~/components/ui/toast";
import { createClient } from "~/lib/supabase/client";
import { fromLocalInput, parseHashtags, toLocalInput } from "~/lib/time";
import { api, type RouterOutputs } from "~/trpc/react";

export type FeedPost = RouterOutputs["post"]["list"][number];

export type Draft = { caption: string; hashtags: string[]; prompt: string };

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  draft: Draft | null;
  post: FeedPost | null;
};

export function PostDialog({ open, onClose, ...rest }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={rest.post ? "Edit post" : "Schedule this post"}
    >
      <PostForm onClose={onClose} {...rest} />
    </Dialog>
  );
}

function PostForm({
  onClose,
  userId,
  draft,
  post,
}: Omit<Props, "open">) {
  const toast = useToast();
  const utils = api.useUtils();

  const [caption, setCaption] = useState(post?.caption ?? draft?.caption ?? "");
  const [tags, setTags] = useState((post?.hashtags ?? draft?.hashtags ?? []).join(" "));
  const [when, setWhen] = useState(toLocalInput(post?.scheduled_at ?? null));
  const [place, setPlace] = useState<Place | null>(post?.location ?? null);
  const [imagePath, setImagePath] = useState<string | null>(post?.image_path ?? null);
  const [preview, setPreview] = useState<string | null>(post?.imageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = () => {
    void utils.post.list.invalidate();
    onClose();
  };

  const create = api.post.create.useMutation({
    onSuccess: (r) => {
      toast.success(when ? "Post scheduled." : "Draft saved.");
      if (!r.driveSynced && r.driveError) toast.error(`Drive: ${r.driveError}`);
      if (r.emailError) toast.error(`Email: ${r.emailError}`);
      done();
    },
    onError: (e) => setError(e.message),
  });

  const update = api.post.update.useMutation({
    onSuccess: (r) => {
      toast.success("Post updated.");
      if (!r.driveSynced && r.driveError) toast.error(`Drive: ${r.driveError}`);
      done();
    },
    onError: (e) => setError(e.message),
  });

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!TYPES.includes(file.type)) return setError("Use a PNG, JPG, WebP or GIF.");
    if (file.size > MAX_BYTES) return setError("Keep the image under 5 MB.");

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("post-media").upload(path, file);
    if (upErr) {
      setUploading(false);
      return setError(`Upload failed: ${upErr.message}`);
    }
    const { data } = await supabase.storage.from("post-media").createSignedUrl(path, 3600);
    setImagePath(path);
    setPreview(data?.signedUrl ?? null);
    setUploading(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const hashtags = parseHashtags(tags);
    const scheduledAt = fromLocalInput(when);

    if (post) {
      const unchangedTime = scheduledAt === post.scheduled_at;
      if (post.image_path && post.image_path !== imagePath) {
        void createClient().storage.from("post-media").remove([post.image_path]);
      }
      update.mutate({
        id: post.id,
        caption,
        hashtags,
        ...(unchangedTime ? {} : { scheduledAt }),
        location: place,
        imagePath,
      });
      return;
    }
    create.mutate({
      prompt: draft?.prompt ?? "",
      caption,
      hashtags,
      scheduledAt,
      imagePath,
      location: place,
    });
  }

  const busy = create.isPending || update.isPending || uploading;

  return (
    <form onSubmit={submit} className="space-y-5">
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div>
        <Label htmlFor="caption">Caption</Label>
        <Textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={2200}
          rows={4}
          required
        />
      </div>

      <div>
        <Label htmlFor="tags">Hashtags</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="#coffee #morning"
        />
        <FieldHint>Separate with spaces.</FieldHint>
      </div>

      <div>
        <Label htmlFor="when">Publish time</Label>
        <Input
          id="when"
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
        />
        <FieldHint>Leave empty to save it as a draft.</FieldHint>
      </div>

      <div>
        <Label>Image</Label>
        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Post attachment"
              className="h-40 w-full rounded-lg border border-gray-20 object-cover"
            />
            <Button
              variant="secondary"
              size="small"
              iconOnly
              aria-label="Remove image"
              className="absolute top-2 right-2"
              onClick={() => {
                setImagePath(null);
                setPreview(null);
              }}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <label className="t-text-s flex h-24 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-30 text-gray-60 hover:bg-gray-10">
            <ImagePlus className="size-4" aria-hidden />
            {uploading ? "Uploading..." : "Add an image (up to 5 MB)"}
            <input
              type="file"
              accept={TYPES.join(",")}
              className="sr-only"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </label>
        )}
      </div>

      <div>
        <Label>Location</Label>
        <LocationPicker value={place} onChange={setPlace} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" isLoading={busy}>
          {post ? "Save changes" : when ? "Schedule post" : "Save draft"}
        </Button>
      </div>
    </form>
  );
}
