import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header"; // ✅ Import your Header component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "slAIde - AI Presentation Generator",
  description: "Convert your MP3 or MP4 files into AI-generated presentations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ✅ Enable smooth scrolling globally
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        {/* ✅ Global Header */}
        <Header title="sl" />

        {/* ✅ Add padding so content isn’t hidden under the fixed header */}
        <main className="pt-24 flex justify-center">{children}</main>
      </body>
    </html>
  );
}
