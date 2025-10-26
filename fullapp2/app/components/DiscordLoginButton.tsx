// app/components/DiscordLoginButton.tsx
"use client";

interface DiscordLoginButtonProps {
  clientId: string;
  redirectUri: string;
}

export default function DiscordLoginButton({
  clientId,
  redirectUri,
}: DiscordLoginButtonProps) {
  return (
    <a
      href={`https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=identify email`}
      className="px-6 py-2 bg-pink-400 rounded-lg text-white font-semibold hover:bg-pink-500 transition"
    >
      Login with Discord
    </a>
  );
}
