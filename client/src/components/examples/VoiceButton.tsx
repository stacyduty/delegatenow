import { useState } from "react";
import VoiceButton from "../VoiceButton";

export default function VoiceButtonExample() {
  const [state, setState] = useState<"idle" | "listening" | "processing">("idle");

  const handleToggle = () => {
    if (state === "idle") {
      setState("listening");
      console.log("Voice recording started");
      setTimeout(() => {
        setState("processing");
        console.log("Processing voice input...");
        setTimeout(() => {
          setState("idle");
          console.log("Voice processing complete");
        }, 2000);
      }, 3000);
    } else if (state === "listening") {
      setState("processing");
      console.log("Processing voice input...");
      setTimeout(() => {
        setState("idle");
        console.log("Voice processing complete");
      }, 2000);
    }
  };

  return <VoiceButton state={state} onToggle={handleToggle} />;
}
