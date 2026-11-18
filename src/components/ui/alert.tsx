import { cn } from "~/lib/cn";

export function Alert({
  tone = "info",
  className,
  children,
}: {
  tone?: "info" | "danger";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "t-text-s rounded-lg border px-3 py-2.5",
        tone === "danger"
          ? "border-red/40 bg-red/5 text-black"
          : "border-blue/30 bg-blue/5 text-black",
        className,
      )}
    >
      {children}
    </div>
  );
}
