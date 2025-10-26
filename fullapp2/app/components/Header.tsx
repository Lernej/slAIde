import DiscordLoginButton from "../components/DiscordLoginButton";

interface HeaderProps {
  title?: string;
}

export default function Header({ title = "slAide" }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full bg-black/90 backdrop-blur-md border-b border-pink-500/30 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        {/* Title with part highlighted */}
        <h1 className="text-2xl font-extrabold text-white">
          {/* Split the word and highlight "AI" */}
          {title.split("AI")[0]}
          <span className="text-pink-400 font-serif">AI</span>
          {title.split("AI")[1]}
          de
        </h1>

        {/* Optional navigation links */}
        <nav className="space-x-4 hidden md:flex justify-center items-center">
          <a
            href="#"
            className="text-white/80 hover:text-pink-400 transition-colors duration-200 font-medium"
          >
            Home
          </a>
          <a
            href="#"
            className="text-white/80 hover:text-pink-400 transition-colors duration-200 font-medium"
          >
            Features
          </a>
          <a
            href="#"
            className="text-white/80 hover:text-pink-400 transition-colors duration-200 font-medium"
          >
            Contact
          </a>
          <DiscordLoginButton
            clientId={process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!}
            redirectUri={process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI!}
          />
        </nav>
      </div>
    </header>
  );
}
