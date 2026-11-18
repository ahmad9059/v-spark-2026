"use client";

import { useState } from "react";

import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Dialog } from "~/components/ui/dialog";
import { FieldHint, Input, Label, Select } from "~/components/ui/field";
import { Skeleton } from "~/components/ui/skeleton";
import { Switch } from "~/components/ui/switch";
import { useToast } from "~/components/ui/toast";
import { api } from "~/trpc/react";

const LEAD_TIMES = [
  { value: 0, label: "At the scheduled time" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 180, label: "3 hours before" },
  { value: 1440, label: "1 day before" },
];

export function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Email notifications">
      <SettingsForm onClose={onClose} />
    </Dialog>
  );
}

function SettingsForm({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const utils = api.useUtils();
  const query = api.settings.get.useQuery();
  const save = api.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved.");
      void utils.settings.get.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  const test = api.settings.sendTest.useMutation({
    onSuccess: (r) => toast.success(`Test email sent to ${r.sentTo}.`),
    onError: (e) => toast.error(e.message),
  });

  if (query.isLoading) return <Skeleton className="h-64" />;
  if (query.error || !query.data) {
    return <Alert tone="danger">{query.error?.message ?? "Could not load settings."}</Alert>;
  }
  return <Loaded initial={query.data} save={save} test={test} onClose={onClose} />;
}

type Initial = NonNullable<ReturnType<typeof api.settings.get.useQuery>["data"]>;

function Loaded({
  initial,
  save,
  test,
  onClose,
}: {
  initial: Initial;
  save: ReturnType<typeof api.settings.update.useMutation>;
  test: ReturnType<typeof api.settings.sendTest.useMutation>;
  onClose: () => void;
}) {
  const [s, setS] = useState({
    enabled: initial.enabled,
    email: initial.email,
    notifyOnSchedule: initial.notifyOnSchedule,
    remindMinutesBefore: initial.remindMinutesBefore,
    subject: initial.subject,
    includeCaption: initial.includeCaption,
  });
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) =>
    setS((cur) => ({ ...cur, [k]: v }));

  const fieldError = save.error?.data?.zodError?.fieldErrors;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(s);
      }}
    >
      {!initial.mailReady ? (
        <Alert tone="danger">
          The server has no email account yet. Add SMTP_USER and SMTP_PASS to send mail.
        </Alert>
      ) : null}

      <Row
        title="Send me emails"
        body="Turn this off to stop every notification."
        control={
          <Switch label="Send me emails" checked={s.enabled} onChange={(v) => set("enabled", v)} />
        }
      />

      <div>
        <Label htmlFor="n-email">Send to</Label>
        <Input
          id="n-email"
          type="email"
          value={s.email}
          onChange={(e) => set("email", e.target.value)}
          aria-invalid={Boolean(fieldError?.email)}
        />
        {fieldError?.email ? <FieldHint error>{fieldError.email[0]}</FieldHint> : null}
      </div>

      <Row
        title="Email when I schedule a post"
        body="One note right after you save."
        control={
          <Switch
            label="Email when I schedule a post"
            checked={s.notifyOnSchedule}
            onChange={(v) => set("notifyOnSchedule", v)}
          />
        }
      />

      <div>
        <Label htmlFor="n-lead">Reminder</Label>
        <Select
          id="n-lead"
          value={s.remindMinutesBefore}
          onChange={(e) => set("remindMinutesBefore", Number(e.target.value))}
        >
          {LEAD_TIMES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="n-subject">Subject line</Label>
        <Input
          id="n-subject"
          value={s.subject}
          maxLength={120}
          onChange={(e) => set("subject", e.target.value)}
          aria-invalid={Boolean(fieldError?.subject)}
        />
        {fieldError?.subject ? <FieldHint error>{fieldError.subject[0]}</FieldHint> : null}
      </div>

      <Row
        title="Show the caption in the email"
        body="Turn off to keep emails short."
        control={
          <Switch
            label="Show the caption in the email"
            checked={s.includeCaption}
            onChange={(v) => set("includeCaption", v)}
          />
        }
      />

      <div className="flex flex-wrap justify-between gap-2 pt-2">
        <Button
          variant="secondary"
          isLoading={test.isPending}
          onClick={() => test.mutate()}
          title="Sends with your last saved settings"
        >
          Send test email
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={save.isPending}>
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}

function Row({
  title,
  body,
  control,
}: {
  title: string;
  body: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="t-text-s text-black">{title}</p>
        <p className="t-text-xs text-gray-60">{body}</p>
      </div>
      {control}
    </div>
  );
}
