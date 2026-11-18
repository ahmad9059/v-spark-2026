import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="t-title-xs font-semibold tracking-tight text-black">
      Spark<span className="text-blue"> Scheduler</span>
    </Link>
  );
}
