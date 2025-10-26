"use client";

import React from "react";

const features = [
  {
    title: "AI-Powered Transcription",
    description:
      "Upload audio or video files and get instant AI-generated text transcriptions with high accuracy.",
    icon: "🎙️",
  },
  {
    title: "Automated Presentation Creation",
    description:
      "Turn your text or audio into visually appealing presentations in seconds, ready to share.",
    icon: "📊",
  },
  {
    title: "Customizable Templates",
    description:
      "Enter your own text and preferences to create a unique presentation that suits your needs.",
    icon: "🎨",
  },
  {
    title: "Great Upgradability",
    description:
      "Given the usage of A2A and other advanced techniques, our platform is designed to evolve and adapt.",
    icon: "☁️",
  },
];

const FeaturesPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-black/40 backdrop-blur-xl p-8 text-white flex flex-col items-center w-full">
      <h1 className="text-5xl font-extrabold mb-8 text-center bg-linear-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">
        Features
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-black/50 backdrop-blur-md p-6 rounded-2xl shadow-lg flex flex-col items-center text-center hover:scale-105 transition-transform"
          >
            <div className="text-5xl mb-4">{feature.icon}</div>
            <h2 className="text-xl font-bold mb-2">{feature.title}</h2>
            <p className="text-gray-300">{feature.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
};

export default FeaturesPage;
