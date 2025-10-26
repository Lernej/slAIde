"use client";

import FileUploadClient from "./components/FileUploadClient";
import LiquidEther from "./components/Background";
import DiscordLoginButton from "./components/DiscordLoginButton";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import DOMPurify from "dompurify";

export default function Home() {
  const learnMoreRef = useRef<HTMLDivElement | null>(null);
  const [response, setResponse] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [htmlString, setHtmlString] = useState("");
  const [showHtml, setShowHtml] = useState(false); // 👈 controls overlay visibility
  const [htmlUrl, setHtmlUrl] = useState("");

  // New state for pdf
  const [artifactUrl, setArtifactUrl] = useState<string>(""); // points to /api/artifact?path=...
  const [artifactKind, setArtifactKind] = useState<"html" | "pdf" | "">("");

  // Helper to strip Markdown/Docstring fences from inline HTML
  const stripFences = (s: string) => {
    if (!s) return s;
    const trimmed = s.trim();
    const backtickFence = /^```(?:\w+)?\s*([\s\S]*?)\s*```$/i;
    const singleQuoteFence = /^'''(?:\w+)?\s*([\s\S]*?)\s*'''$/i;
    let m = trimmed.match(backtickFence);
    if (m) return m[1].trim();
    m = trimmed.match(singleQuoteFence);
    if (m) return m[1].trim();

    // Fallback: remove leading/trailing fences and any stray fence-only lines
    let out = trimmed
      .replace(/^```html\s*/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .replace(/^'''html\s*/i, "")
      .replace(/^'''/i, "")
      .replace(/'''$/i, "");

    // Remove any standalone fence lines anywhere in the doc
    out = out.replace(/(^|\n)\s*```(?:\w+)?\s*(?=\n|$)/g, "$1");
    out = out.replace(/(^|\n)\s*'''(?:\w+)?\s*(?=\n|$)/g, "$1");

    // As a final guard, remove any remaining triple-backticks or triple-single quotes
    out = out.replace(/```/g, "");
    out = out.replace(/'''/g, "");

    return out;
  };

  useEffect(() => {
    if (!htmlString) return;

    // Create blob from cleaned HTML (do not mutate htmlString here)
    const cleaned = stripFences(htmlString);
    const blob = new Blob([cleaned], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setHtmlUrl(url);

    return () => URL.revokeObjectURL(url); // clean up old URLs
  }, [htmlString]);

  // Helper to call our proxy API and normalize Host response
  const generateArtifact = async (prompt: string) => {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Generate failed: ${res.status} ${text}`);
    }

    return res.json();
  };

  const promptAgent = async () => {
    setLoading(true);
    setArtifactUrl("");
    setArtifactKind("");
    setHtmlString("");
    setHtmlUrl("");
    try {
      // Send user message to Host through proxy so we avoid CORS and handle both HTML/PDF
      const data = await generateArtifact(message.trim());

      if (data.kind === "pdf" && typeof data.filePath === "string") {
        // Stream the PDF through our artifact route
        const url = `/api/artifact?path=${encodeURIComponent(data.filePath)}`;
        setArtifactKind("pdf");
        setArtifactUrl(url);
      } else if (data.kind === "html" && typeof data.filePath === "string") {
        // Stream the saved HTML file from disk
        const url = `/api/artifact?path=${encodeURIComponent(data.filePath)}`;
        setArtifactKind("html");
        setArtifactUrl(url);
      } else if (data.kind === "html-inline" && typeof data.html === "string") {
        // Fallback when Host returns the HTML string directly — strip fences
        setArtifactKind("html");
        setHtmlString(stripFences(data.html));
      } else {
        console.error("Unexpected response:", data);
        alert("Unexpected response from generator. Check server logs.");
      }
    } catch (error) {
      console.error("Error generating artifact:", error);
      alert("Generation failed. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  async function testConnection() {
    const response = await fetch("http://localhost:8000/list-apps");
    const agents = await response.json();
    console.log("Available agents:", agents);
  }

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  const scrollToLearnMore = () => {
    learnMoreRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen w-full text-center p-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <LiquidEther
          className="absolute top-0 left-0 w-full h-full -z-10"
          colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={1000}
          autoRampDuration={0.6}
        />
      </div>

      {/* ✅ Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {/* ✅ AI Result Overlay */}

      {/* Main container */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl gap-10 bg-black/40 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl">
        {/* Left content */}
        <div className="flex-1 text-left text-white space-y-6">
          <h1 className="text-5xl font-extrabold bg-linear-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent leading-tight">
            Presentations Made Easy with AI
          </h1>
          <p className="text-lg text-gray-200 leading-relaxed">
            Transform your{" "}
            <span className="font-semibold text-purple-300">MP3</span> or{" "}
            <span className="font-semibold text-pink-300">MP4</span> files into
            beautiful, AI-generated presentations in seconds.
            <br /> Just drag your file into the box on the right — we’ll handle
            the rest!
          </p>

          <div className="pt-4">
            <button
              onClick={scrollToLearnMore}
              className="px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold shadow-lg hover:opacity-90 transition-all duration-300"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Right side drop zone */}
        <div className="flex-1 flex flex-col items-center gap-4">
          <FileUploadClient />
          <button
            onClick={promptAgent}
            className="bg-white text-black rounded-xl p-2 font-semibold hover:bg-gray-200 transition-all"
          >
            Enter
          </button>
          <textarea
            placeholder="Enter instructions or preferences for your presentation..."
            className="w-full mt-4 p-4 rounded-2xl bg-pink-50/20 border border-pink-400 placeholder-pink-200 text-white focus:ring-2 focus:ring-pink-400 focus:outline-none transition-colors"
            rows={4}
            onChange={(e) => setMessage(e.target.value)}
          />

          {/* Action buttons after generation */}
          {(artifactKind === "html" || artifactKind === "pdf") &&
            artifactUrl && (
              <div className="mt-4 flex gap-4">
                <a
                  href={artifactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all"
                >
                  Open Generated {artifactKind.toUpperCase()}
                </a>
                <a
                  href={artifactUrl}
                  download={
                    artifactKind === "pdf" ? "generated.pdf" : "generated.html"
                  }
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all"
                >
                  Download {artifactKind.toUpperCase()}
                </a>
              </div>
            )}

          {/* Inline HTML fallback */}
          {artifactKind === "html" && !artifactUrl && htmlUrl && (
            <div className="mt-4 flex gap-4">
              <a
                href={htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all"
              >
                Open Generated Slideshow
              </a>
              <a
                href={htmlUrl}
                download="generated.html"
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all"
              >
                Download Slideshow
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Learn More Section */}
      <section
        ref={learnMoreRef}
        className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl mt-32 bg-black/40 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl scroll-mt-24"
      >
        <div className="flex-1 text-left text-white space-y-6">
          <h2 className="text-4xl font-bold bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            Upload your audio or video file, and our app will automatically
            extract key points, generate slides, and create a polished
            presentation saving you hours of work. By utilizing Google's
            advanced A2A AI agent etc......
          </p>
        </div>

        <div className="flex-1 flex justify-center mt-8 md:mt-0">
          <Image
            src="/A2A.png"
            alt="A2A photo"
            width={400}
            height={300}
            className="rounded-2xl shadow-lg border-2 border-pink-500"
          />
        </div>
      </section>
    </main>
  );
}
