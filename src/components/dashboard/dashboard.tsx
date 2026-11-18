"use client";

import { Bell, CloudCheck, LogOut, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GoogleButton } from "~/components/auth/google-button";
import { Feed } from "~/components/dashboard/feed";
import { Generator } from "~/components/dashboard/generator";
import {
  PostDialog,
  type Draft,
  type FeedPost,
} from "~/components/dashboard/post-dialog";
import { SettingsDialog } from "~/components/dashboard/settings-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/toast";
import { Wordmark } from "~/components/wordmark";
import { createClient } from "~/lib/supabase/client";
import { api } from "~/trpc/react";

export function Dashboard({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<FeedPost | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const drive = api.drive.status.useQuery();
  const toast = useToast();
  const utils = api.useUtils();
  const syncAll = api.drive.syncAll.useMutation({
    onSuccess: (r) => {
      void utils.post.list.invalidate();
      if (r.error) toast.error(`Drive: ${r.error}`);
      else toast.success(`Synced ${r.synced} of ${r.total} posts to Drive.`);
    },
    onError: (e) => toast.error(e.message),
  });

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-10">
      <header className="border-b border-gray-20 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Wordmark href="/dashboard" />
          <div className="flex flex-wrap items-center gap-2">
            {drive.data?.connected ? (
              <>
                <Badge tone="blue">
                  <CloudCheck className="size-3" aria-hidden /> Drive connected
                </Badge>
                <Button
                  variant="secondary"
                  size="small"
                  isLoading={syncAll.isPending}
                  onClick={() => syncAll.mutate()}
                >
                  <RefreshCw className="size-3" aria-hidden /> Sync all
                </Button>
                <GoogleButton variant="tertiary" size="small">
                  Reconnect Drive
                </GoogleButton>
              </>
            ) : drive.data ? (
              <GoogleButton variant="secondary" size="small">
                Connect Google Drive
              </GoogleButton>
            ) : null}
            <Button variant="secondary" size="small" onClick={() => setSettingsOpen(true)}>
              <Bell className="size-3" aria-hidden /> Notifications
            </Button>
            <span className="t-text-xs hidden text-gray-60 md:inline">{email}</span>
            <Button variant="tertiary-alt" size="small" onClick={logout}>
              <LogOut className="size-3" aria-hidden /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2">
        <Generator onPick={setDraft} />
        <Feed onEdit={setEditing} />
      </main>

      <PostDialog
        open={Boolean(draft) || Boolean(editing)}
        onClose={() => {
          setDraft(null);
          setEditing(null);
        }}
        userId={userId}
        draft={draft}
        post={editing}
      />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
