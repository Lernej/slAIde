import Link from "next/link";

interface HeaderProps {
  title?: string;
}

export default function Header({ title = "sl" }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full bg-black/90 backdrop-blur-md border-b border-pink-500/30 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        {/* Title with part highlighted */}
        <h1 className="text-2xl font-extrabold text-white">
          {title.split("AI")[0]}
          <span className="text-pink-400 font-serif">AI</span>
          {title.split("AI")[1]}
          de
        </h1>

        {/* Navigation links */}
        <nav className="space-x-4 hidden md:flex justify-center items-center">
          <Link
            href="/"
            className="text-white/80 hover:text-pink-400 transition-colors duration-200 font-medium"
          >
            Home
          </Link>
          <Link
            href="/features"
            className="text-white/80 hover:text-pink-400 transition-colors duration-200 font-medium"
          >
            Features
          </Link>
          <Link
            href="/contact"
            className="text-white/80 hover:text-pink-400 transition-colors duration-200 font-medium"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
