import { AuthShowcase } from "~/components/auth/auth-showcase";
import { Wordmark } from "~/components/wordmark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <Wordmark />
        <div className="flex flex-1 items-center justify-center py-12">
          {children}
        </div>
      </div>
      <aside className="relative hidden flex-col justify-between gap-8 overflow-hidden bg-black p-12 text-white lg:flex">
        <div className="flex flex-1 items-center py-6">
          <AuthShowcase />
        </div>
        <div>
          <p className="t-eyebrow-m text-blue-on-dark">Spark Scheduler</p>
          <p className="t-title-l mt-4 max-w-md">
            One idea in. Three captions out. Posted on time.
          </p>
          <p className="t-text-l text-gray-30 mt-4 max-w-md">
            Gemini writes. You pick. We schedule it, save it to Drive and email
            you before it goes live.
          </p>
        </div>
      </aside>
    </div>
  );
}
