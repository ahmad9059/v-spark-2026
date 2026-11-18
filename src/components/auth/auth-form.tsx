"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { GoogleButton } from "~/components/auth/google-button";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { FieldHint, Input, Label } from "~/components/ui/field";
import { createClient } from "~/lib/supabase/client";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/dashboard";

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setNotice(null);

    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({ email: f.email?.[0], password: f.password?.[0] });
      return;
    }
    setErrors({});
    setLoading(true);

    const supabase = createClient();
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) {
        setFormError(error.message);
        setLoading(false);
        return;
      }
      router.replace(next);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setFormError(error.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      router.replace(next);
      router.refresh();
      return;
    }
    setNotice("Check your inbox. Click the link we sent to finish signing up.");
    setLoading(false);
  }

  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-sm">
      <p className="t-eyebrow-m">{isLogin ? "Welcome back" : "Get started"}</p>
      <h1 className="t-title-m mt-2">
        {isLogin ? "Sign in" : "Make your account"}
      </h1>
      <p className="t-text-m mt-2 text-gray-60">
        {isLogin
          ? "Pick up where you left off."
          : "It takes under a minute. No card."}
      </p>

      <div className="mt-6">
        <GoogleButton next={next}>Continue with Google</GoogleButton>
        <p className="t-text-xs mt-2 text-gray-60">
          Google also connects your Drive, so posts are saved there too.
        </p>
      </div>

      <div className="my-6 flex items-center gap-3 text-gray-50">
        <span className="h-px flex-1 bg-gray-20" />
        <span className="t-text-xs">or use email</span>
        <span className="h-px flex-1 bg-gray-20" />
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
        {notice ? <Alert>{notice}</Alert> : null}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? <FieldHint error>{errors.email}</FieldHint> : null}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder="At least 8 characters"
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password ? <FieldHint error>{errors.password}</FieldHint> : null}
        </div>
        <Button type="submit" isLoading={loading} className="w-full">
          {isLogin ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="t-text-s mt-6 text-gray-60">
        {isLogin ? "New here? " : "Have an account? "}
        <Link
          href={isLogin ? "/signup" : "/login"}
          className="text-blue hover:underline"
        >
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
