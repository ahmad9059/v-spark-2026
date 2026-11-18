import Link from "next/link";
import { CalendarClock, HardDrive, Mail, Sparkles } from "lucide-react";

import { Wordmark } from "~/components/wordmark";

const features = [
  {
    icon: Sparkles,
    title: "Three captions, one prompt",
    body: "Tell Gemini what the post is about. Get three options with hashtags. Pick your favorite.",
  },
  {
    icon: CalendarClock,
    title: "Schedule in seconds",
    body: "Choose a time, add a photo and a location. Edit or delete it any time.",
  },
  {
    icon: HardDrive,
    title: "Saved to your Drive",
    body: "Every post lands in a Google Drive folder you own. No copy and paste.",
  },
  {
    icon: Mail,
    title: "Emails that fit you",
    body: "Get a note when you schedule and a reminder before it's due. You set the rules.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Wordmark />
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="t-text-s rounded-lg px-3 py-1.5 text-ink hover:bg-gray-10"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="t-text-s rounded-lg bg-blue px-3 py-1.5 font-semibold text-white hover:bg-[#0046cc]"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
          <p className="t-eyebrow-m">AI captions + scheduler</p>
          <h1 className="t-title-xxl mt-4 max-w-3xl">
            Stop staring at a blank caption box.
          </h1>
          <p className="t-text-xl mt-6 max-w-xl text-gray-70">
            What if one sentence turned into three ready-to-post captions, a
            schedule and a saved copy in your Drive?
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-lg bg-blue px-5 text-[14px] font-semibold text-white hover:bg-[#0046cc]"
            >
              Write my first post
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg border border-stroke px-5 text-[14px] font-semibold text-ink hover:bg-gray-10"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="bg-black py-20 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <p className="t-eyebrow-m text-blue-on-dark">How it works</p>
            <h2 className="t-title-l mt-3 max-w-2xl">
              Write. Pick. Schedule. Done.
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <Icon className="size-6 text-blue-on-dark" aria-hidden />
                  <h3 className="t-title-xs mt-4">{title}</h3>
                  <p className="t-text-m mt-2 text-gray-30">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-8">
        <p className="t-text-s text-gray-60">
          Built for VSPARK 2026 · COMSATS University Islamabad, Vehari Campus
        </p>
      </footer>
    </div>
  );
}
