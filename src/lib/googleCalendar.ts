import { google } from 'googleapis';

// Google Calendar configuration
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || '';
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || '';

// Initialize Google Calendar API
const getCalendarClient = () => {
  const auth = new google.auth.JWT(
    GOOGLE_CLIENT_EMAIL,
    undefined,
    GOOGLE_PRIVATE_KEY,
    ['https://www.googleapis.com/auth/calendar']
  );

  return google.calendar({ version: 'v3', auth });
};

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
}

export const googleCalendarService = {
  // Create a calendar event
  async createEvent(eventData: CalendarEvent): Promise<string | null> {
    try {
      const calendar = getCalendarClient();
      
      const response = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: eventData,
      });

      console.log('Created Google Calendar event:', response.data.id);
      return response.data.id || null;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw error;
    }
  },

  // Delete a calendar event
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const calendar = getCalendarClient();
      
      await calendar.events.delete({
        calendarId: CALENDAR_ID,
        eventId: eventId,
      });

      console.log('Deleted Google Calendar event:', eventId);
      return true;
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      // If event doesn't exist, consider it successfully "deleted"
      if (error instanceof Error && error.message.includes('404')) {
        console.log('Event not found, considering it deleted:', eventId);
        return true;
      }
      throw error;
    }
  },

  // Update a calendar event
  async updateEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<boolean> {
    try {
      const calendar = getCalendarClient();
      
      await calendar.events.patch({
        calendarId: CALENDAR_ID,
        eventId: eventId,
        requestBody: eventData,
      });

      console.log('Updated Google Calendar event:', eventId);
      return true;
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw error;
    }
  },

  // Get event details
  async getEvent(eventId: string): Promise<any> {
    try {
      const calendar = getCalendarClient();
      
      const response = await calendar.events.get({
        calendarId: CALENDAR_ID,
        eventId: eventId,
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Google Calendar event:', error);
      throw error;
    }
  }
};

// Helper function to format session data for Google Calendar
export const formatSessionForCalendar = (session: any, client: any): CalendarEvent => {
  // Combine date and time for start
  const startDateTime = new Date(`${session.bookingDate}T${session.bookingTime}:00`);
  
  // Assume 1 hour duration (you can adjust this)
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

  const dogName = session.dogName || client.dogName || '';
  const clientName = `${client.firstName} ${client.lastName}`.trim();
  
  return {
    summary: `${session.sessionType} - ${clientName}${dogName ? ` w/ ${dogName}` : ''}`,
    description: `
Session Type: ${session.sessionType}
Client: ${clientName}
${dogName ? `Dog: ${dogName}` : ''}
Quote: £${session.quote}
${session.notes ? `Notes: ${session.notes}` : ''}
    `.trim(),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'Europe/London', // Adjust timezone as needed
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'Europe/London', // Adjust timezone as needed
    },
    location: session.sessionType === 'In-Person' ? client.address || '' : 'Online',
  };
};
