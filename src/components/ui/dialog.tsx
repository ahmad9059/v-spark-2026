"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "~/components/ui/button";

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg border border-gray-20 bg-white p-0 text-black backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b border-gray-20 px-5 py-4">
        <h2 className="t-title-xs">{title}</h2>
        <Button
          variant="tertiary-alt"
          iconOnly
          aria-label="Close"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto p-5">{open ? children : null}</div>
    </dialog>
  );
}
