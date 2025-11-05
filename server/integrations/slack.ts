import crypto from "crypto";

interface SlackOAuthResponse {
  ok: boolean;
  access_token?: string;
  team?: {
    id: string;
    name: string;
  };
  authed_user?: {
    id: string;
  };
  scope?: string;
  error?: string;
}

interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<SlackOAuthResponse> {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Slack OAuth credentials not configured");
  }

  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await response.json();
  return data as SlackOAuthResponse;
}

export async function postMessage(
  accessToken: string,
  channel: string,
  text: string,
  blocks?: any[]
): Promise<void> {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      channel,
      text,
      blocks,
    }),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }
}

export async function listChannels(accessToken: string): Promise<SlackChannel[]> {
  const response = await fetch("https://slack.com/api/conversations.list?types=public_channel,private_channel", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  return data.channels as SlackChannel[];
}

export function formatTaskForSlack(task: any): any {
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

  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${impactEmoji} New Task: ${task.title}`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Impact:* ${impactEmoji} ${task.impact}`,
          },
          {
            type: "mrkdwn",
            text: `*Urgency:* ${urgencyEmoji} ${task.urgency}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Description:*\n${task.description || "No description provided"}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Assigned to:* ${task.assigneeName || "Unassigned"}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Task",
            },
            url: `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/tasks/${task.id}`,
            action_id: "view_task",
          },
        ],
      },
    ],
  };
}

export function verifySlackRequest(signature: string, timestamp: string, body: string): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    throw new Error("Slack signing secret not configured");
  }

  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (parseInt(timestamp) < fiveMinutesAgo) {
    return false; // Request is too old
  }

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = `v0=${crypto
    .createHmac("sha256", signingSecret)
    .update(sigBasestring)
    .digest("hex")}`;

  return crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature));
}
