import { cn } from "~/lib/cn";

const tones = {
  neutral: "bg-gray-10 text-gray-80",
  blue: "bg-blue/10 text-blue",
  dark: "bg-black text-white",
} as const;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "t-eyebrow-s inline-flex items-center gap-1 rounded-full px-2 py-0.5 normal-case tracking-normal",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
