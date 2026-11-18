import { Bell, CloudCheck, Sparkles } from "lucide-react";
import Image from "next/image";

function Chip({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  className: string;
}) {
  return (
    <div
      className={`t-text-xs border-gray-80 bg-gray-90 absolute flex items-center gap-2 rounded-lg border px-3 py-2 whitespace-nowrap text-white shadow-xl ${className}`}
    >
      <span className="text-blue-on-dark">{icon}</span>
      {children}
    </div>
  );
}

export function AuthShowcase() {
  return (
    <div className="relative isolate mx-auto w-full max-w-md" aria-hidden>
      <div className="bg-blue/25 absolute -inset-20 -z-10 rounded-full blur-3xl" />

      <div className="border-gray-80 bg-gray-90 absolute inset-x-6 -top-4 h-full rounded-lg border" />
      <div className="border-gray-80 absolute inset-x-3 -top-2 h-full rounded-lg border bg-gray-100" />

      <div className="relative overflow-hidden rounded-lg bg-white text-black shadow-2xl">
        <Image
          src="/showcase-coffee.png"
          alt=""
          width={1200}
          height={800}
          className="h-44 w-full object-cover [@media(max-height:820px)]:h-28"
          priority
        />
        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="bg-blue flex size-6 items-center justify-center rounded-full text-[11px] font-semibold text-white">
              S
            </span>
            <span className="t-text-xs text-gray-60">Instagram · Friendly</span>
          </div>
          <p className="t-text-m mt-3 text-black">
            We are finally open in Vehari! Come for the coffee, stay for the
            good vibes.
          </p>
          <p className="t-text-s text-blue mt-2">
            #Vehari #NewCafe #CoffeeLovers
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="t-eyebrow-s bg-blue/10 text-blue rounded-full px-2 py-0.5 tracking-normal normal-case">
              Scheduled · Fri 9:00 AM
            </span>
            <span className="t-eyebrow-s bg-gray-10 text-gray-80 rounded-full px-2 py-0.5 tracking-normal normal-case">
              In Drive
            </span>
          </div>
        </div>
      </div>

      <Chip className="-top-4 right-6" icon={<Sparkles className="size-3.5" />}>
        3 captions ready
      </Chip>
      <Chip
        className="-right-4 -bottom-6"
        icon={<CloudCheck className="size-3.5" />}
      >
        Saved to Google Drive
      </Chip>
      <Chip className="-bottom-6 -left-4" icon={<Bell className="size-3.5" />}>
        Reminder 30 min before
      </Chip>
    </div>
  );
}
