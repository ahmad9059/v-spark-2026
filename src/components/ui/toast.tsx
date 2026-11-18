"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { cn } from "~/lib/cn";

type Toast = { id: number; message: string; tone: "success" | "danger" };
type ToastApi = { success: (m: string) => void; error: (m: string) => void };

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: Toast["tone"]) => {
    const id = Date.now() + Math.random();
    setItems((cur) => [...cur, { id, message, tone }]);
    setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), 4500);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push(m, "success"),
      error: (m) => push(m, "danger"),
    }),
    [push],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="fixed right-4 bottom-4 left-4 z-50 flex flex-col items-end gap-2 sm:left-auto"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "t-text-s w-full max-w-sm rounded-lg border px-4 py-3 text-white shadow-lg",
              t.tone === "danger"
                ? "border-red bg-gray-100"
                : "border-gray-90 bg-gray-100",
            )}
          >
            <span
              className={cn(
                "mr-2 inline-block size-2 rounded-full",
                t.tone === "danger" ? "bg-red" : "bg-blue-on-dark",
              )}
            />
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
