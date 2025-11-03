import { X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceButton from "./VoiceButton";
import { cn } from "@/lib/utils";

type VoiceState = "idle" | "listening" | "processing";

interface VoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  state: VoiceState;
  onToggleVoice: () => void;
  transcript?: string;
  analysis?: {
    title: string;
    impact: string;
    urgency: string;
    suggestedAssignee?: string;
  };
}

export default function VoiceOverlay({
  isOpen,
  onClose,
  state,
  onToggleVoice,
  transcript,
  analysis,
}: VoiceOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto h-full flex flex-col items-center justify-center p-6 max-w-3xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 right-6"
          onClick={onClose}
          data-testid="button-close-voice-overlay"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="flex flex-col items-center gap-8 w-full">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Voice Delegation</h2>
            <p className="text-muted-foreground">
              {state === "idle" && "Press the button and speak your task"}
              {state === "listening" && "Listening... Speak now"}
              {state === "processing" && "Processing your request..."}
            </p>
          </div>

          <VoiceButton state={state} onToggle={onToggleVoice} />

          {transcript && (
            <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="font-semibold mb-2">Transcript</h3>
                <p className="text-muted-foreground">{transcript}</p>
              </div>

              {analysis && (
                <div className="p-6 rounded-lg border bg-card space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-status-online" />
                    <h3 className="font-semibold">AI Analysis Complete</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Task:</span>
                      <p className="font-medium">{analysis.title}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Impact:</span>
                        <p className={cn(
                          "font-medium",
                          analysis.impact === "high" && "text-chart-1"
                        )}>{analysis.impact}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Urgency:</span>
                        <p className={cn(
                          "font-medium",
                          analysis.urgency === "high" && "text-destructive"
                        )}>{analysis.urgency}</p>
                      </div>
                    </div>
                    {analysis.suggestedAssignee && (
                      <div>
                        <span className="text-sm text-muted-foreground">Suggested Assignee:</span>
                        <p className="font-medium">{analysis.suggestedAssignee}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1" data-testid="button-confirm-delegate">
                      Confirm & Delegate
                    </Button>
                    <Button variant="outline" className="flex-1" data-testid="button-edit-details">
                      Edit Details
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
