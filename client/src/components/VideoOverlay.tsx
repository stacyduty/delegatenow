import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, CheckCircle, Video, Square, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type VideoState = "idle" | "recording" | "preview" | "uploading" | "processing";

interface VideoOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoOverlay({ isOpen, onClose }: VideoOverlayProps) {
  const [state, setState] = useState<VideoState>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoURL, setVideoURL] = useState<string>("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [processingStats, setProcessingStats] = useState<any>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  const uploadVideoMutation = useMutation({
    mutationFn: async (videoBlob: Blob) => {
      const formData = new FormData();
      formData.append('video', videoBlob, 'recording.webm');

      setUploadProgress(0);
      setState("uploading");

      const response = await fetch('/api/tasks/analyze-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process video');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setProcessingStats(data.processingStats);
      setState("idle");
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Task Created from Video",
        description: `Created task: "${data.analysis.title}"`,
      });
    },
    onError: (error: Error) => {
      console.error("Error processing video:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process video. Please try again.",
        variant: "destructive",
      });
      setState("preview");
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setVideoURL(URL.createObjectURL(blob));
        setState("preview");
        stopCamera();
      };

      mediaRecorder.start();
      setState("recording");
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at 10 minutes (600 seconds)
          if (newTime >= 600) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera and microphone access to record video.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Video file must be under 100MB",
        variant: "destructive",
      });
      return;
    }

    setRecordedBlob(file);
    setVideoURL(URL.createObjectURL(file));
    setState("preview");
  };

  const handleAnalyze = () => {
    if (recordedBlob) {
      setState("processing");
      uploadVideoMutation.mutate(recordedBlob);
    }
  };

  const handleReset = () => {
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }
    setRecordedBlob(null);
    setVideoURL("");
    setAnalysis(null);
    setProcessingStats(null);
    setRecordingTime(0);
    setState("idle");
  };

  const handleClose = () => {
    stopRecording();
    stopCamera();
    handleReset();
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (videoURL) {
        URL.revokeObjectURL(videoURL);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto h-full flex flex-col items-center justify-center p-6 max-w-4xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 right-6"
          onClick={handleClose}
          data-testid="button-close-video-overlay"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="flex flex-col items-center gap-6 w-full">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Video Delegation</h2>
            <p className="text-muted-foreground">
              {state === "idle" && "Record or upload a video message"}
              {state === "recording" && `Recording... ${formatTime(recordingTime)}`}
              {state === "preview" && "Review your video before processing"}
              {state === "uploading" && "Uploading video..."}
              {state === "processing" && "AI is transcribing and analyzing..."}
            </p>
          </div>

          {/* Video Display */}
          <div className="w-full max-w-2xl">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={videoURL}
                controls={state === "preview"}
                muted={state === "recording"}
                className="w-full h-full object-cover"
                data-testid="video-preview"
              />
              {state === "recording" && (
                <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                  <span className="font-mono">{formatTime(recordingTime)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 flex-wrap justify-center">
            {state === "idle" && (
              <>
                <Button
                  onClick={startRecording}
                  size="lg"
                  data-testid="button-start-recording"
                >
                  <Video className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => document.getElementById('video-upload')?.click()}
                  data-testid="button-upload-video"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Video
                </Button>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleUploadFile}
                  className="hidden"
                />
              </>
            )}

            {state === "recording" && (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                data-testid="button-stop-recording"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Recording
              </Button>
            )}

            {state === "preview" && (
              <>
                <Button
                  onClick={handleAnalyze}
                  size="lg"
                  data-testid="button-analyze-video"
                >
                  <Loader2 className="h-5 w-5 mr-2" />
                  Analyze with AI
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  size="lg"
                  data-testid="button-reset-video"
                >
                  Record Again
                </Button>
              </>
            )}

            {(state === "uploading" || state === "processing") && (
              <div className="w-full max-w-md">
                <Progress value={state === "uploading" ? uploadProgress : 50} className="mb-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {state === "uploading" ? "Uploading..." : "Processing..."}
                </p>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {analysis && (
            <Card className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4" data-testid="card-video-analysis">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-status-online" />
                    <h3 className="font-semibold">Task Created from Video</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    data-testid="button-create-another-video"
                  >
                    Create Another
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Task Title:</span>
                    <p className="font-medium" data-testid="text-video-analysis-title">{analysis.title}</p>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">Impact:</span>
                      <Badge
                        variant={analysis.impact === "high" ? "destructive" : "secondary"}
                        data-testid="badge-video-analysis-impact"
                      >
                        {analysis.impact}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">Urgency:</span>
                      <Badge
                        variant={analysis.urgency === "high" ? "destructive" : "secondary"}
                        data-testid="badge-video-analysis-urgency"
                      >
                        {analysis.urgency}
                      </Badge>
                    </div>
                  </div>
                  {analysis.suggestedAssignee && (
                    <div>
                      <span className="text-sm text-muted-foreground">Suggested Assignee:</span>
                      <p className="font-medium" data-testid="text-video-analysis-assignee">
                        {analysis.suggestedAssignee}
                      </p>
                    </div>
                  )}
                  {processingStats && (
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      Processing time: {Math.round(processingStats.totalProcessingTime / 1000)}s
                      (Transcription: {Math.round(processingStats.transcriptionTime / 1000)}s, 
                      Analysis: {Math.round(processingStats.analysisTime / 1000)}s)
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
