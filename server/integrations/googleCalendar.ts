import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

export async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function listCalendarEvents(
  timeMin?: Date,
  timeMax?: Date,
  maxResults: number = 50
) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: (timeMin || new Date()).toISOString(),
    timeMax: timeMax?.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

export async function createCalendarEvent(params: {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
}) {
  const calendar = await getUncachableGoogleCalendarClient();

  const event = {
    summary: params.summary,
    description: params.description,
    start: {
      dateTime: params.startTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: params.endTime.toISOString(),
      timeZone: 'UTC',
    },
    attendees: params.attendees?.map(email => ({ email })),
    reminders: {
      useDefault: true,
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return response.data;
}

export async function deleteCalendarEvent(eventId: string) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
}

export async function updateCalendarEvent(
  eventId: string,
  params: {
    summary?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
  }
) {
  const calendar = await getUncachableGoogleCalendarClient();

  const event: any = {};
  if (params.summary) event.summary = params.summary;
  if (params.description) event.description = params.description;
  if (params.startTime) {
    event.start = {
      dateTime: params.startTime.toISOString(),
      timeZone: 'UTC',
    };
  }
  if (params.endTime) {
    event.end = {
      dateTime: params.endTime.toISOString(),
      timeZone: 'UTC',
    };
  }

  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: event,
  });

  return response.data;
}

export async function getFreeBusyInfo(
  emails: string[],
  timeMin: Date,
  timeMax: Date
) {
  const calendar = await getUncachableGoogleCalendarClient();

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: emails.map(email => ({ id: email })),
    },
  });

  return response.data.calendars;
}

export async function createMeetingWithLink(params: {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
}) {
  const calendar = await getUncachableGoogleCalendarClient();

  const event = {
    summary: params.summary,
    description: params.description,
    start: {
      dateTime: params.startTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: params.endTime.toISOString(),
      timeZone: 'UTC',
    },
    attendees: params.attendees?.map(email => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: true,
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    conferenceDataVersion: 1, // Required to generate Meet link
  });

  // Extract Meet link
  const meetLink = response.data.conferenceData?.entryPoints?.find(
    (ep: any) => ep.entryPointType === 'video'
  )?.uri;

  return {
    event: response.data,
    meetLink,
    meetingCode: meetLink?.split('/').pop(),
  };
}
