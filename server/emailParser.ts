import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://proxy.replitai.com/v1",
  apiKey: process.env.REPL_ID ?? "fake-dummy-key-not-needed-when-running-in-replit",
});

async function callAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages as any,
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || "";
}

interface EmailTaskExtraction {
  shouldCreateTask: boolean;
  taskData?: {
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    urgency: 'low' | 'medium' | 'high';
    suggestedAssignee?: string;
    dueDate?: string; // ISO date string
    smartObjectives?: string;
  };
  reason?: string;
}

export async function analyzeEmailForTask(
  from: string,
  subject: string,
  bodyText: string,
  teamMemberNames: string[]
): Promise<EmailTaskExtraction> {
  const teamMembersContext = teamMemberNames.length > 0
    ? `Available team members to delegate to: ${teamMemberNames.join(', ')}`
    : 'No team members available';

  const systemPrompt = `You are an AI assistant that helps executives manage their tasks by analyzing emails. Your job is to determine if an email should be converted into a delegated task, and if so, extract the task details.

Analyze the email and determine:
1. Should this email be converted into a task? (Yes/No)
   - YES if: Email contains action items, requests, or work that needs to be done
   - NO if: Email is just informational, spam, marketing, or doesn't require action

2. If YES, extract:
   - Task title (concise, action-oriented)
   - Task description (detailed, including context from email)
   - Impact (low/medium/high) - business impact of completing this task
   - Urgency (low/medium/high) - time sensitivity
   - Suggested assignee (if mentioned in email or context suggests who should do it)
   - Due date (if mentioned in email)
   - SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound breakdown)

${teamMembersContext}

Respond in JSON format:
{
  "shouldCreateTask": boolean,
  "taskData": {
    "title": "string",
    "description": "string",
    "impact": "low" | "medium" | "high",
    "urgency": "low" | "medium" | "high",
    "suggestedAssignee": "string or null",
    "dueDate": "ISO date string or null",
    "smartObjectives": "string"
  },
  "reason": "Brief explanation of why this should or shouldn't be a task"
}`;

  const userPrompt = `Email Analysis Request:

FROM: ${from}
SUBJECT: ${subject}

BODY:
${bodyText}

Should this email be converted into a task? If yes, extract all task details.`;

  try {
    const response = await callAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    // Clean up AI response - remove markdown code fences and extra whitespace
    let cleanedResponse = response.trim();
    
    // Remove markdown JSON code fences if present
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    cleanedResponse = cleanedResponse.trim();

    // Parse AI response
    let result: EmailTaskExtraction;
    try {
      result = JSON.parse(cleanedResponse) as EmailTaskExtraction;
    } catch (parseError) {
      console.error("Failed to parse AI response:", cleanedResponse);
      throw new Error("Invalid JSON response from AI");
    }

    // Validate the structure
    if (typeof result.shouldCreateTask !== 'boolean') {
      throw new Error("AI response missing shouldCreateTask field");
    }

    if (result.shouldCreateTask && !result.taskData) {
      throw new Error("AI indicated task should be created but provided no task data");
    }

    return result;
  } catch (error) {
    console.error("Error analyzing email for task:", error);
    // Default to not creating a task if AI analysis fails
    return {
      shouldCreateTask: false,
      reason: "Failed to analyze email: " + (error as Error).message,
    };
  }
}

// Helper to clean HTML email body to plain text (basic implementation)
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Replace common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  
  // Replace <br> and </p> with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  text = text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
  
  // Clean up whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  
  return text;
}
