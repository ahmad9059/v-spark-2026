import "~/styles/globals.css";

import { type Metadata } from "next";
import { Poppins } from "next/font/google";

import { ToastProvider } from "~/components/ui/toast";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Spark Scheduler | Write it. Schedule it. Done.",
  description:
    "Turn one idea into three captions with Gemini, schedule the post, and keep a copy in Google Drive.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <TRPCReactProvider>
          <ToastProvider>{children}</ToastProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
