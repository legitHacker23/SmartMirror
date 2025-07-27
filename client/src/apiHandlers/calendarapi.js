import axios from 'axios';

// Google Calendar API configuration
const API_KEY = 'AIzaSyCQajGpEkzTyV1qG_WNcAFyW2Hc0mpuvps';
const CALENDAR_ID = 'nbmendoza1432@gmail.com'; // Use your personal calendar email
const BASE_URL = 'https://www.googleapis.com/calendar/v3';

// Function to get calendar events
export async function getCalendar() {
  try {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Format dates for Google Calendar API
    const timeMin = now.toISOString();
    const timeMax = oneWeekFromNow.toISOString();
    
    const response = await axios.get(`${BASE_URL}/calendars/${CALENDAR_ID}/events`, {
      params: {
        key: API_KEY,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50
      }
    });
    
    return {
      events: response.data.items || [],
      error: null
    };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    
    // Return empty events array if API fails
    return {
      events: [],
      error: error.response?.data?.error?.message || error.message || 'Failed to fetch calendar events'
    };
  }
}