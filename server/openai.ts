import OpenAI from "openai";
import fs from "fs";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface TaskAnalysis {
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  urgency: "low" | "medium" | "high";
  suggestedAssignee?: string;
  smartObjectives: {
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
  };
  estimatedDuration?: string;
}

// Generic AI call function for reuse
export async function callAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages as any,
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || "";
}

export async function analyzeVoiceTask(transcript: string, teamMembers?: string[]): Promise<TaskAnalysis> {
  const teamMemberList = teamMembers && teamMembers.length > 0
    ? `Available team members: ${teamMembers.join(", ")}`
    : "";

  const prompt = `You are an AI executive assistant analyzing a delegated task. Analyze the following voice transcript and extract:
1. A clear, concise task title (max 10 words)
2. A detailed description
3. Impact level (low/medium/high) - how much value this creates
4. Urgency level (low/medium/high) - how time-sensitive it is
5. Suggested assignee - IMPORTANT: If a specific person is mentioned in the transcript, always suggest that exact person. Match the name exactly as it appears in the available team members list. Only suggest a different person if no one is mentioned in the transcript.
6. SMART objectives breakdown:
   - Specific: What exactly needs to be done
   - Measurable: How will success be measured
   - Achievable: What resources/skills are needed
   - Relevant: Why this matters to the organization
   - Time-bound: Realistic deadline or timeline

${teamMemberList}

Voice transcript: "${transcript}"

IMPORTANT: If the transcript mentions a specific person by name (e.g., "I need [Name] to..."), you MUST use that exact name as the suggestedAssignee. Match it exactly from the available team members list.

Return ONLY valid JSON with this exact structure:
{
  "title": "string",
  "description": "string",
  "impact": "low" | "medium" | "high",
  "urgency": "low" | "medium" | "high",
  "suggestedAssignee": "string or null",
  "smartObjectives": {
    "specific": "string",
    "measurable": "string",
    "achievable": "string",
    "relevant": "string",
    "timeBound": "string"
  },
  "estimatedDuration": "string (e.g., '2 days', '1 week')"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const analysis = JSON.parse(content);

    return {
      title: analysis.title,
      description: analysis.description,
      impact: analysis.impact,
      urgency: analysis.urgency,
      suggestedAssignee: analysis.suggestedAssignee,
      smartObjectives: analysis.smartObjectives,
      estimatedDuration: analysis.estimatedDuration,
    };
  } catch (error) {
    console.error("Error analyzing task with AI:", error);
    throw new Error("Failed to analyze task");
  }
}

export async function transcribeAudio(audioFilePath: string): Promise<string> {
  try {
    const audioFile = fs.createReadStream(audioFilePath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "text",
    });

    return transcription;
  } catch (error) {
    console.error("Error transcribing audio with Whisper:", error);
    throw new Error("Failed to transcribe audio");
  }
}
