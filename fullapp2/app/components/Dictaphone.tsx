"use client";

import React from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useEffect, useRef, useState } from "react";

interface DictaphoneProps {
  // Accepts a React state setter style function
  appendToMessage: (updater: (prev: string) => string) => void;
}

const Dictaphone: React.FC<DictaphoneProps> = ({ appendToMessage }) => {
  const {
    transcript, // full transcript (interim + final)
    interimTranscript,
    finalTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Ensure we only render on the client to avoid SSR hydration mismatches
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track last committed text to parent to avoid duplicates
  const lastCommittedRef = useRef("");

  // Commit only finalized text. If finalTranscript not growing yet, commit when interim clears
  useEffect(() => {
    if (!mounted) return;

    let stableText = "";
    if (
      finalTranscript &&
      finalTranscript.length > lastCommittedRef.current.length
    ) {
      stableText = finalTranscript;
    } else if (
      interimTranscript === "" &&
      transcript &&
      transcript.length > lastCommittedRef.current.length
    ) {
      // No interim text present: treat transcript as finalized
      stableText = transcript;
    }

    if (stableText) {
      const delta = stableText.slice(lastCommittedRef.current.length);
      if (delta && delta.trim()) {
        appendToMessage((prev) => (prev ? prev + " " + delta : delta));
        lastCommittedRef.current = stableText;
      }
    }
  }, [
    finalTranscript,
    interimTranscript,
    transcript,
    appendToMessage,
    mounted,
  ]);

  // Debug: log stream changes (can be removed later)
  useEffect(() => {
    if (!mounted) return;
    // Console log to help verify events are coming through
    // eslint-disable-next-line no-console
    console.debug("SpeechRecognition:", {
      listening,
      interimTranscript,
      finalTranscript,
      transcript,
    });
  }, [listening, interimTranscript, finalTranscript, transcript, mounted]);

  // While not mounted (SSR/first render), render nothing so markup matches on server and first client paint
  if (!mounted) return null;

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="p-4 rounded-2xl bg-gray-800/50 border border-gray-700 text-white text-center w-64">
        Browser doesn't support speech recognition.
      </div>
    );
  }

  const start = async () => {
    try {
      // Ensure mic permission is granted before starting recognition
      if (
        typeof navigator !== "undefined" &&
        navigator.mediaDevices?.getUserMedia
      ) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (e) {
      console.error("Mic permission error:", e);
    }
    SpeechRecognition.startListening({
      continuous: true,
      language: "en-US",
      interimResults: true,
    });
  };

  const stop = () => {
    SpeechRecognition.stopListening();
  };

  const resetAll = () => {
    resetTranscript();
    lastCommittedRef.current = "";
    appendToMessage(() => "");
  };

  const micStatusText = listening ? "on" : "off";

  return (
    <div className="w-64 p-4 rounded-2xl bg-pink-50/20 border border-pink-400 shadow-lg flex flex-col gap-4">
      <p className="text-sm font-extrabold text-gray-300 text-center">
        {`Microphone: ${micStatusText}`}
      </p>

      <div className="flex gap-1">
        <button
          onClick={start}
          className="w-full px-4 py-2 bg-linear-to-r from-purple-500 to-pink-500 rounded-xl text-white font-extrabold shadow-md hover:opacity-90 transition-all"
        >
          Start
        </button>
        <button
          onClick={stop}
          className="w-full font-extrabold px-2 py-2 bg-gray-700 rounded-xl text-white shadow-md hover:bg-gray-600 transition-all"
        >
          Stop
        </button>
        <button
          onClick={resetAll}
          className="w-full px-2 py-2 bg-pink-600 rounded-xl font-extrabold text-white shadow-md hover:bg-pink-500 transition-all"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Dictaphone;
