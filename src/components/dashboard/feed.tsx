"use client";

import { CalendarClock, CloudCheck, MapPin, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { MapPreview } from "~/components/dashboard/location-picker";
import { type FeedPost } from "~/components/dashboard/post-dialog";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Dialog } from "~/components/ui/dialog";
import { Empty } from "~/components/ui/empty";
import { Skeleton } from "~/components/ui/skeleton";
import { useToast } from "~/components/ui/toast";
import { formatWhen } from "~/lib/time";
import { api } from "~/trpc/react";

const STATUS = {
  draft: { label: "Draft", tone: "neutral" },
  scheduled: { label: "Scheduled", tone: "blue" },
  sent: { label: "Sent", tone: "dark" },
} as const;

export function Feed({ onEdit }: { onEdit: (p: FeedPost) => void }) {
  const toast = useToast();
  const utils = api.useUtils();
  const list = api.post.list.useQuery();
  const [toDelete, setToDelete] = useState<FeedPost | null>(null);

  const remove = api.post.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deleted.");
      setToDelete(null);
      void utils.post.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <section aria-labelledby="feed-title">
      <p className="t-eyebrow-m">Your posts</p>
      <h2 id="feed-title" className="t-title-s mt-1">
        Feed
      </h2>

      <div className="mt-4 space-y-3">
        {list.isLoading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)
          : null}
        {list.error ? <Alert tone="danger">{list.error.message}</Alert> : null}
        {list.data?.length === 0 ? (
          <Empty
            icon={<CalendarClock className="size-8" aria-hidden />}
            title="No posts yet"
          >
            Write your first caption on the left. It shows up here.
          </Empty>
        ) : null}

        {list.data?.map((p) => {
          const s = STATUS[p.status as keyof typeof STATUS];
          return (
            <Card key={p.id} className="overflow-hidden">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt=""
                  className="h-40 w-full object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={s.tone}>{s.label}</Badge>
                  {p.drive_file_id ? (
                    <Badge>
                      <CloudCheck className="size-3" aria-hidden /> In Drive
                    </Badge>
                  ) : null}
                  {p.scheduled_at ? (
                    <span className="t-text-xs text-gray-60">
                      {formatWhen(p.scheduled_at)}
                    </span>
                  ) : null}
                </div>
                <p className="t-text-m mt-3 whitespace-pre-wrap text-black">{p.caption}</p>
                {p.hashtags.length ? (
                  <p className="t-text-s mt-2 text-blue">{p.hashtags.join(" ")}</p>
                ) : null}
                {p.location ? (
                  <div className="mt-3 space-y-2">
                    <p className="t-text-xs flex items-center gap-1 text-gray-60">
                      <MapPin className="size-3.5" aria-hidden /> {p.location.name}
                    </p>
                    <MapPreview place={p.location} />
                  </div>
                ) : null}
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="secondary" size="small" onClick={() => onEdit(p)}>
                    <Pencil className="size-3" aria-hidden /> Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    isDanger
                    onClick={() => setToDelete(p)}
                  >
                    <Trash2 className="size-3" aria-hidden /> Delete
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete this post?"
      >
        <p className="t-text-m text-gray-70">
          It leaves your feed, your Drive folder and storage. You can&apos;t undo this.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            Keep it
          </Button>
          <Button
            isDanger
            isLoading={remove.isPending}
            onClick={() => {
              if (toDelete) remove.mutate({ id: toDelete.id });
            }}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
