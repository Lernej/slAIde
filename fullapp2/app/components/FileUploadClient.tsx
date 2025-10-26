"use client";

import FileDropzone from "./FileDropzone";

export default function FileUploadClient() {
  const handleFile = async (file: File) => {
  console.log("File selected in client:", file);

  // Create FormData
  const formData = new FormData();
  formData.append("file", file);

  try {
    // Send to your backend API
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    console.log("Backend response:", data);
  } catch (error) {
    console.error("Error uploading file:", error);
  }
};


  return (
    <div className="w-full max-w-md bg-pink-50/10 backdrop-blur-md border border-pink-300 rounded-3xl shadow-[0_10px_25px_rgba(255,105,180,0.3)] p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-[0_15px_35px_rgba(255,105,180,0.5)]">
      <h2 className="text-pink-100 font-semibold text-lg mb-4">
        Drop your <span className="text-pink-300 font-bold">MP3</span> or{" "}
        <span className="text-pink-300 font-bold">MP4</span> file here 🎵
      </h2>

      {/* FileDropzone component */}
      <FileDropzone onFileSelect={handleFile} />
    </div>
  );
}
