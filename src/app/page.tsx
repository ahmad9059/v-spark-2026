export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 text-center text-white">
      <span className="text-6xl" aria-hidden>
        🚧
      </span>
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
        Under <span className="text-[hsl(280,100%,70%)]">Construction</span>
      </h1>
      <p className="max-w-md text-lg text-white/70">
        VSPARK 2026 is being built. Check back soon.
      </p>
    </main>
  );
}
