import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VoiceState = "idle" | "listening" | "processing";

interface VoiceButtonProps {
  state: VoiceState;
  onToggle: () => void;
  className?: string;
}

export default function VoiceButton({ state, onToggle, className }: VoiceButtonProps) {
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} data-testid="voice-button-container">
      {state === "listening" && (
        <div className="absolute inset-0 animate-ping">
          <div className="h-full w-full rounded-full bg-primary opacity-20"></div>
        </div>
      )}
      <Button
        size="icon"
        variant={state === "idle" ? "default" : "default"}
        onClick={onToggle}
        disabled={state === "processing"}
        className={cn(
          "h-24 w-24 rounded-full shadow-xl transition-all",
          state === "listening" && "scale-105 ring-4 ring-primary/30",
          state === "processing" && "opacity-70"
        )}
        data-testid="button-voice-toggle"
      >
        {state === "processing" ? (
          <Loader2 className="h-10 w-10 animate-spin" />
        ) : state === "listening" ? (
          <MicOff className="h-10 w-10" />
        ) : (
          <Mic className="h-10 w-10" />
        )}
      </Button>
    </div>
  );
}
