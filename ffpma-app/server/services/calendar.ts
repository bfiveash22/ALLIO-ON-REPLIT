import { google } from 'googleapis';

export async function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google OAuth is not fully configured - missing GOOGLE_REFRESH_TOKEN in .env');
  }

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export interface CreateEventParams {
  summary: string;
  description?: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  attendees?: string[]; // Array of emails
  addMeetLink?: boolean;
}

export async function createCalendarEvent(params: CreateEventParams) {
  try {
    const calendar = await getCalendarClient();
    
    const event: any = {
      summary: params.summary,
      description: params.description,
      start: {
        dateTime: params.startTime,
        timeZone: 'UTC', // Defaulting to UTC, can be dynamically adjusted
      },
      end: {
        dateTime: params.endTime,
        timeZone: 'UTC',
      },
    };

    if (params.attendees && params.attendees.length > 0) {
      event.attendees = params.attendees.map(email => ({ email }));
    }

    if (params.addMeetLink) {
      event.conferenceData = {
        createRequest: {
          requestId: `allio-meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      };
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: params.addMeetLink ? 1 : 0,
      sendUpdates: params.attendees ? 'all' : 'none'
    });

    return {
      success: true,
      eventId: response.data.id,
      meetLink: response.data.hangoutLink,
      eventLink: response.data.htmlLink
    };
  } catch (error: any) {
    console.error('Failed to create Calendar Event:', error);
    throw new Error(`Failed to create Calendar Event: ${error.message}`);
  }
}

export async function listUpcomingEvents(maxResults: number = 10) {
  try {
    const calendar = await getCalendarClient();
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    return response.data.items || [];
  } catch (error: any) {
    console.error('Failed to list Calendar Events:', error);
    throw new Error(`Failed to list Calendar Events: ${error.message}`);
  }
}
