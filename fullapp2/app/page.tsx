"use client";

// Removed FileDropzone import
import LiquidEther from "./components/Background";
// Removed unused DiscordLoginButton import
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import DOMPurify from "dompurify";
import Dictaphone from "./components/Dictaphone";

export default function Home() {
  const learnMoreRef = useRef<HTMLDivElement | null>(null);
  const [response, setResponse] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [htmlString, setHtmlString] = useState("");
  const [showHtml, setShowHtml] = useState(false);
  const [htmlUrl, setHtmlUrl] = useState("");

  // New state for pdf/html artifacts saved on disk
  const [artifactUrl, setArtifactUrl] = useState<string>("");
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
    let out = trimmed
      .replace(/^```html\s*/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .replace(/^'''html\s*/i, "")
      .replace(/^'''/i, "")
      .replace(/'''$/i, "");
    out = out.replace(/(^|\n)\s*```(?:\w+)?\s*(?=\n|$)/g, "$1");
    out = out.replace(/(^|\n)\s*'''(?:\w+)?\s*(?=\n|$)/g, "$1");
    out = out.replace(/```/g, "");
    out = out.replace(/'''/g, "");
    return out;
  };

  // Update HTML preview URL when htmlString changes
  useEffect(() => {
    if (!htmlString) return;
    const blob = new Blob([stripFences(htmlString)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setHtmlUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [htmlString]);

  // Proxy to Host to generate artifact
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

  // Prompt AI agent (keeps current functionality)
  const promptAgent = async () => {
    setLoading(true);
    setArtifactUrl("");
    setArtifactKind("");
    setHtmlString("");
    setHtmlUrl("");
    try {
      const data = await generateArtifact(message.trim());
      if (data.kind === "pdf" && typeof data.filePath === "string") {
        const url = `/api/artifact?path=${encodeURIComponent(data.filePath)}`;
        setArtifactKind("pdf");
        setArtifactUrl(url);
      } else if (data.kind === "html" && typeof data.filePath === "string") {
        const url = `/api/artifact?path=${encodeURIComponent(data.filePath)}`;
        setArtifactKind("html");
        setArtifactUrl(url);
      } else if (data.kind === "html-inline" && typeof data.html === "string") {
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
          className="absolute top-0 left-0 w-full h-screen"
          colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={1000}
          autoRampDuration={0.6}
        />
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl gap-10 bg-black/40 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl">
        {/* Left Content (match provided text) */}
        <div className="flex-1 text-left text-white">
          {/* Heading */}
          <h1 className="text-4xl font-extrabold bg-linear-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent leading-tight text-center space-y-2">
            <span>Presentations </span>
            <span>and PDF Generation at the Click of a Button</span>
          </h1>
          <span className="block h-1 w-full bg-pink-500 mx-auto my-2 rounded-full"></span>
          {/* Paragraphs */}
          <p className="text-lg text-gray-200 leading-relaxed mt-2">
            Transform your text or microphone input into polished results — no
            setup required.
          </p>
          <p className="text-2xl font-extrabold text-purple-300 leading-relaxed ">
            AI-generated presentations and summaries
          </p>
          <p className="text-lg text-gray-200 leading-relaxed mt-2">
            Type in the box or use the microphone — our A2A agents route your
            request and generate either a slideshow or a PDF summary
            automatically.
          </p>

          {/* Button */}
          <div className="pt-4">
            <button
              onClick={scrollToLearnMore}
              className="px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold shadow-lg hover:opacity-90 transition-all duration-300"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col items-center gap-4">
          {/* Generated HTML Links (inline htmlString) */}
          {htmlUrl && (
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

          {/* Artifact buttons when files are saved to disk (retain current functionality) */}
          {(artifactKind === "html" || artifactKind === "pdf") &&
            artifactUrl && (
              <div className="mt-2 flex gap-4">
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

          {/* Bigger Textarea */}
          <textarea
            placeholder="Enter instructions or preferences for your presentation..."
            className="w-full mt-4 p-4 rounded-2xl bg-pink-50/20 border border-pink-400 placeholder-pink-200 text-white focus:ring-2 focus:ring-pink-400 focus:outline-none transition-colors min-h-48 md:min-h-64"
            rows={10}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <div className="flex items-center w-full mx-auto">
            {/* Microphone Input */}
            <div className="flex-1 sm:flex-none justify-start items-end">
              <Dictaphone appendToMessage={setMessage} />
            </div>

            {/* Enter Button */}
            <div className="flex justify-center w-full mt-4">
              <button
                onClick={promptAgent}
                className="px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 transition-all duration-300"
              >
                Enter
              </button>
            </div>
          </div>
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
            Our app uses A2A (Agent‑to‑Agent) decision routing to choose the
            right workflow for your input. You can type or speak; ADK-based
            agents coordinate the steps to call LLMs, format the content, and
            render the output. Depending on your request, the system produces
            either an HTML slide deck or a PDF summary — optimized for clarity
            and accuracy. The goal is simple: make creating presentations or
            summaries easy, fast, and accessible for everyone — even those with
            no technical background.
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
