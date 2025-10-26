declare module "react-speech-recognition" {
  export interface UseSpeechRecognitionReturn {
    transcript: string;
    interimTranscript?: string;
    finalTranscript?: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
  }

  export function useSpeechRecognition(): UseSpeechRecognitionReturn;

  interface StartListeningOptions {
    continuous?: boolean;
    language?: string;
    interimResults?: boolean;
  }

  const SpeechRecognition: {
    startListening: (options?: StartListeningOptions) => void;
    stopListening: () => void;
  };

  export default SpeechRecognition;
}
