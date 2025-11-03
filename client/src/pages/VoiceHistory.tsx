import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Search, Clock, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface VoiceHistoryEntry {
  id: string;
  transcript: string;
  taskId: string | null;
  processingTime: number;
  success: boolean;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
}

export default function VoiceHistory() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: voiceHistory = [], isLoading: historyLoading } = useQuery<VoiceHistoryEntry[]>({
    queryKey: ["/api/voice-history"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const filteredHistory = voiceHistory.filter(entry =>
    entry.transcript.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTaskTitle = (taskId: string | null) => {
    if (!taskId) return null;
    const task = tasks.find(t => t.id === taskId);
    return task?.title;
  };

  if (historyLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Voice History</h1>
          <p className="text-muted-foreground">Loading voice transcripts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-voice-history">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-voice-history">Voice History</h1>
        <p className="text-muted-foreground">Complete audit trail of all voice delegations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-total-transcripts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transcripts</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{voiceHistory.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card data-testid="card-successful">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {voiceHistory.filter(h => h.success).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {voiceHistory.length > 0 
                ? Math.round((voiceHistory.filter(h => h.success).length / voiceHistory.length) * 100)
                : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-processing">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {voiceHistory.length > 0
                ? Math.round(
                    voiceHistory.reduce((sum, h) => sum + h.processingTime, 0) / voiceHistory.length
                  ) / 1000
                : 0}s
            </div>
            <p className="text-xs text-muted-foreground">AI analysis time</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-search">
        <CardHeader>
          <CardTitle>Search Transcripts</CardTitle>
          <CardDescription>Find specific voice delegations by keyword</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transcripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-transcripts"
            />
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-transcript-list">
        <CardHeader>
          <CardTitle>Transcript History</CardTitle>
          <CardDescription>
            {filteredHistory.length} of {voiceHistory.length} transcripts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mic className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? "No matching transcripts" : "No voice history yet"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery 
                    ? "Try adjusting your search query"
                    : "Start delegating tasks with your voice to see them here"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((entry) => {
                  const taskTitle = getTaskTitle(entry.taskId);
                  
                  return (
                    <Card key={entry.id} data-testid={`card-transcript-${entry.id}`}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                {entry.success ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                )}
                                <span className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {entry.processingTime}ms
                                </Badge>
                              </div>
                              <p className="text-sm leading-relaxed" data-testid="text-transcript">
                                "{entry.transcript}"
                              </p>
                              {taskTitle && (
                                <div className="flex items-center gap-2 pt-2">
                                  <Badge variant="secondary">Task Created</Badge>
                                  <Link href={`/tasks`}>
                                    <Button variant="ghost" size="sm" className="h-7 gap-1">
                                      <span className="text-xs">{taskTitle}</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
