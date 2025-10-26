// app/api/auth/discord/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Type for Discord token response
interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

// Type for Discord user response
interface DiscordUserResponse {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  // Exchange code for access token
  const tokenParams = new URLSearchParams();
  tokenParams.append("client_id", process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!);
  tokenParams.append("client_secret", process.env.DISCORD_CLIENT_SECRET!);
  tokenParams.append("grant_type", "authorization_code");
  tokenParams.append("code", code);
  tokenParams.append("redirect_uri", process.env.DISCORD_REDIRECT_URI!);

  let tokenResponse;
  try {
    tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: tokenParams,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch token", details: err }, { status: 500 });
  }

  const tokenJson = (await tokenResponse.json()) as DiscordTokenResponse;
  const accessToken = tokenJson.access_token;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Failed to get access token", details: tokenJson },
      { status: 400 }
    );
  }

  // Fetch user info from Discord
  let userResponse;
  try {
    userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch user info", details: err }, { status: 500 });
  }

  const userInfo = (await userResponse.json()) as DiscordUserResponse;

  if (!userInfo.id) {
    return NextResponse.json(
      { error: "Failed to fetch user info from Discord", details: userInfo },
      { status: 400 }
    );
  }

  // Upsert user into Supabase
  const { data: supabaseData, error: supabaseError } = await supabase
    .from("users")
    .upsert({
      discord_id: userInfo.id,
      username: userInfo.username,
      email: userInfo.email,
      avatar: userInfo.avatar,
      access_token: accessToken, // optional
    })
    .select();

  if (supabaseError) {
    console.error("Supabase upsert error:", supabaseError);
    return NextResponse.json(
      { error: "Failed to upsert user into database", details: supabaseError },
      { status: 500 }
    );
  }

  return NextResponse.json({ user: supabaseData });
}
