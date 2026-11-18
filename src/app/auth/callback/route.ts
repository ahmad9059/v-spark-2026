import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "~/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Supabase only hands over the Google refresh token on this first exchange.
  const refresh = data.session.provider_refresh_token;
  if (refresh) {
    await supabase
      .from("google_tokens")
      .upsert({ user_id: data.session.user.id, refresh_token: refresh });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
