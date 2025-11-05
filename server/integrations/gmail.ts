import type { google } from "googleapis";

interface GmailCredentials {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
  expires_in?: number;
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    parts?: Array<{ mimeType: string; body: { data?: string } }>;
    body?: { data?: string };
  };
}

/**
 * Exchange authorization code for Gmail access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<GmailCredentials> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google OAuth error: ${error}`);
  }

  return await response.json();
}

/**
 * Get user's Gmail profile information
 */
export async function getUserProfile(accessToken: string): Promise<{
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
}> {
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error: ${error}`);
  }

  return await response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh error: ${error}`);
  }

  return await response.json();
}

/**
 * List messages with specific label (e.g., "DELEGATE" custom label)
 */
export async function listMessages(
  accessToken: string,
  labelIds: string[] = ["INBOX"],
  maxResults: number = 10
): Promise<GmailMessage[]> {
  // Gmail expects multiple labelIds parameters, not comma-separated
  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
  });
  
  // Add each label as a separate parameter
  labelIds.forEach(labelId => {
    params.append("labelIds", labelId);
  });

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error: ${error}`);
  }

  const data = await response.json();
  
  if (!data.messages || data.messages.length === 0) {
    return [];
  }

  // Fetch full message details for each message
  const messages = await Promise.all(
    data.messages.map(async (msg: { id: string }) => {
      return await getMessage(accessToken, msg.id);
    })
  );

  return messages;
}

/**
 * Get a specific message by ID
 */
export async function getMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessage> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error: ${error}`);
  }

  return await response.json();
}

/**
 * Send an email via Gmail
 */
export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  threadId?: string
): Promise<void> {
  // Create RFC 2822 formatted email
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    body,
  ];
  
  const email = emailLines.join("\r\n");
  const encodedEmail = Buffer.from(email).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const requestBody: any = {
    raw: encodedEmail,
  };

  if (threadId) {
    requestBody.threadId = threadId;
  }

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error: ${error}`);
  }
}

/**
 * Create or get a label by name
 */
export async function getOrCreateLabel(
  accessToken: string,
  labelName: string
): Promise<string> {
  // List existing labels
  const listResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/labels",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!listResponse.ok) {
    const error = await listResponse.text();
    throw new Error(`Gmail API error: ${error}`);
  }

  const { labels } = await listResponse.json();
  const existingLabel = labels.find((l: any) => l.name === labelName);

  if (existingLabel) {
    return existingLabel.id;
  }

  // Create new label
  const createResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/labels",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: labelName,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      }),
    }
  );

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Gmail API error: ${error}`);
  }

  const newLabel = await createResponse.json();
  return newLabel.id;
}

/**
 * Extract email headers (from, subject, etc.)
 */
export function extractHeaders(message: GmailMessage): {
  from: string;
  fromName: string;
  subject: string;
  to: string;
  date: string;
} {
  const headers = message.payload.headers;
  
  const from = headers.find((h) => h.name.toLowerCase() === "from")?.value || "";
  const subject = headers.find((h) => h.name.toLowerCase() === "subject")?.value || "";
  const to = headers.find((h) => h.name.toLowerCase() === "to")?.value || "";
  const date = headers.find((h) => h.name.toLowerCase() === "date")?.value || "";

  // Extract email address from "Name <email@example.com>" format
  const emailMatch = from.match(/<(.+?)>/);
  const fromEmail = emailMatch ? emailMatch[1] : from;
  const fromName = emailMatch ? from.replace(/<.+?>/, "").trim() : from;

  return {
    from: fromEmail,
    fromName,
    subject,
    to,
    date,
  };
}

/**
 * Decode Gmail base64url encoded data
 */
function decodeBase64Url(data: string): string {
  // Gmail uses URL-safe base64: replace - with + and _ with /
  let base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  
  // Add padding if needed (Gmail may omit it)
  const padding = base64.length % 4;
  if (padding > 0) {
    base64 += "=".repeat(4 - padding);
  }
  
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Extract email body (plain text or HTML)
 */
export function extractBody(message: GmailMessage): {
  bodyText: string;
  bodyHtml: string;
} {
  let bodyText = "";
  let bodyHtml = "";

  // Try to get body from parts
  if (message.payload.parts && message.payload.parts.length > 0) {
    for (const part of message.payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        bodyText = decodeBase64Url(part.body.data);
      } else if (part.mimeType === "text/html" && part.body?.data) {
        bodyHtml = decodeBase64Url(part.body.data);
      }
    }
  }

  // Fallback to direct body
  if (!bodyText && !bodyHtml && message.payload.body?.data) {
    const decodedBody = decodeBase64Url(message.payload.body.data);
    // Assume HTML if contains tags
    if (decodedBody.includes("<html>") || decodedBody.includes("<body>")) {
      bodyHtml = decodedBody;
    } else {
      bodyText = decodedBody;
    }
  }

  return { bodyText, bodyHtml };
}

/**
 * Format task as HTML email
 */
export function formatTaskAsEmail(task: any): string {
  const impactEmojiMap: Record<string, string> = {
    low: "🔵",
    medium: "🟡",
    high: "🔴",
  };
  const impactEmoji = impactEmojiMap[task.impact as string] || "⚪";

  const urgencyEmojiMap: Record<string, string> = {
    low: "🐢",
    medium: "🏃",
    high: "🚨",
  };
  const urgencyEmoji = urgencyEmojiMap[task.urgency as string] || "⏱️";

  const dueDateText = task.dueDate
    ? `<p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>`
    : "";

  const assigneeText = task.teamMemberName
    ? `<p><strong>Assigned to:</strong> ${task.teamMemberName}</p>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f4f4f4; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .content { background: #fff; padding: 20px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 8px; }
    .impact-high { background: #fee; color: #c00; }
    .impact-medium { background: #ffc; color: #860; }
    .impact-low { background: #def; color: #036; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${impactEmoji} ${task.title}</h1>
    </div>
    <div class="content">
      <p><strong>Description:</strong></p>
      <p>${task.description || "No description provided"}</p>
      
      <p><strong>Impact:</strong> <span class="badge impact-${task.impact}">${impactEmoji} ${task.impact?.toUpperCase()}</span></p>
      <p><strong>Urgency:</strong> ${urgencyEmoji} ${task.urgency}</p>
      ${dueDateText}
      ${assigneeText}
      
      ${task.aiAnalysis ? `
      <p><strong>SMART Objectives:</strong></p>
      <p>${task.aiAnalysis}</p>
      ` : ""}
      
      <p><strong>Status:</strong> ${task.status}</p>
      <p><strong>Progress:</strong> ${task.progress}%</p>
    </div>
    <div class="footer">
      <p>This task was created via Deleg8te.ai - AI-powered task delegation platform</p>
      <p>Reply to this email to add comments or questions about this task.</p>
    </div>
  </div>
</body>
</html>
`;
}
