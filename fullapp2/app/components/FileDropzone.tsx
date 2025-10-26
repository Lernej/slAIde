"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface FileDropzoneProps {
  onFileSelect?: (file: File) => void;
}

export default function FileDropzone({ onFileSelect }: FileDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selected = acceptedFiles[0];
      if (selected) {
        setFile(selected);
        onFileSelect?.(selected);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "audio/mpeg": [".mp3"],
      "video/mp4": [".mp4"],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center border-2 rounded-2xl p-6 w-full max-w-md cursor-pointer transition-all duration-300
        ${
          isDragActive
            ? "border-pink-400 bg-pink-50/20 shadow-[0_0_20px_rgba(255,105,180,0.5)]"
            : "border-pink-300 bg-pink-50/10 hover:shadow-[0_0_15px_rgba(255,105,180,0.3)]"
        }
        backdrop-blur-sm`}
    >
      <input {...getInputProps()} />
      {file ? (
        <p className="text-pink-200 font-medium text-center wrap-break-words">
          {file.name}
        </p>
      ) : (
        <p className="text-pink-100 text-center">
          {isDragActive
            ? "Drop your MP3 or MP4 file here..."
            : "Click or drag to select your file"}
        </p>
      )}
    </div>
  );
}
