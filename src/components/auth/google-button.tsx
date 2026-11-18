"use client";

import { useState } from "react";

import { Button, type ButtonProps } from "~/components/ui/button";
import { useToast } from "~/components/ui/toast";
import { createClient } from "~/lib/supabase/client";

export function GoogleButton({
  next = "/dashboard",
  children,
  variant = "secondary",
  size,
}: {
  next?: string;
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function go() {
    setLoading(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        scopes: "https://www.googleapis.com/auth/drive.file",
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} size={size} isLoading={loading} onClick={go}>
      {children}
    </Button>
  );
}
