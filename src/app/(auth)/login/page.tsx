import { Suspense } from "react";

import { AuthForm } from "~/components/auth/auth-form";

export const metadata = { title: "Sign in | Spark Scheduler" };

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
