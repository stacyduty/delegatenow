import { useState } from "react";
import VoiceOverlay from "../VoiceOverlay";
import { Button } from "@/components/ui/button";

export default function VoiceOverlayExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<"idle" | "listening" | "processing">("idle");
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);

  const handleToggleVoice = () => {
    if (state === "idle") {
      setState("listening");
      console.log("Started listening");
      
      setTimeout(() => {
        setTranscript("I need someone to develop the Q1 marketing strategy focusing on digital channels and customer acquisition. This is high priority and needs to be done within the next two weeks.");
        setState("processing");
        console.log("Processing...");
        
        setTimeout(() => {
          setAnalysis({
            title: "Develop Q1 Marketing Strategy",
            impact: "high",
            urgency: "high",
            suggestedAssignee: "Sarah Chen - Marketing Director",
          });
          setState("idle");
          console.log("Analysis complete");
        }, 2000);
      }, 3000);
    }
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)} data-testid="button-open-voice">
        Open Voice Overlay
      </Button>
      <VoiceOverlay
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setState("idle");
          setTranscript("");
          setAnalysis(null);
        }}
        state={state}
        onToggleVoice={handleToggleVoice}
        transcript={transcript}
        analysis={analysis}
      />
    </div>
  );
}
