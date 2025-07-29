import React, { useEffect, useState } from 'react';
import { getCalendar } from '../apiHandlers/calendarapi';

const CreateCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate] = useState(new Date());

  useEffect(() => {
    async function fetchCalendar() {
      try {
        setLoading(true);
        const res = await getCalendar();
        setEvents(res?.events || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch calendar events');
        console.error('Calendar fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCalendar();
  }, []);

  // Format time for display
  const formatEventTime = (event) => {
    if (event.start.dateTime) {
      const eventDate = new Date(event.start.dateTime);
      return eventDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (event.start.date) {
      return 'All day';
    }
    return 'No time specified';
  };

  // Get event start time for sorting
  const getEventStartTime = (event) => {
    if (event.start.dateTime) {
      return new Date(event.start.dateTime);
    } else if (event.start.date) {
      return new Date(event.start.date);
    }
    return new Date(0); // Fallback for events without time
  };

  // Sort events by proximity to current time
  const sortEventsByProximity = (eventsList) => {
    const now = new Date();
    return eventsList.sort((a, b) => {
      const timeA = getEventStartTime(a);
      const timeB = getEventStartTime(b);
      
      // If both events are in the future, sort by closest first
      if (timeA > now && timeB > now) {
        return timeA - timeB;
      }
      
      // If both events are in the past, sort by most recent first
      if (timeA < now && timeB < now) {
        return timeB - timeA;
      }
      
      // If one is past and one is future, future events come first
      if (timeA > now && timeB < now) return -1;
      if (timeA < now && timeB > now) return 1;
      
      return 0;
    });
  };

  // Filter events for current date
  const getEventsForCurrentDate = () => {
    const currentDateEvents = events.filter(event => {
      const eventDate = event.start.dateTime 
        ? new Date(event.start.dateTime).toDateString()
        : new Date(event.start.date).toDateString();
      return eventDate === currentDate.toDateString();
    });
    return sortEventsByProximity(currentDateEvents);
  };

  // Filter events for upcoming dates (future events only, excluding today)
  const getUpcomingEvents = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
    
    const upcomingEvents = events.filter(event => {
      const eventDate = event.start.dateTime 
        ? new Date(event.start.dateTime)
        : new Date(event.start.date);
      return eventDate >= tomorrow; // Only include events from tomorrow onwards
    });
    return sortEventsByProximity(upcomingEvents).slice(0, 5); // Limit to 5 upcoming events
  };

  if (loading) {
    return (
      <div className="calendar-container">
        <h2>Upcoming Events for {currentDate.toDateString()}</h2>
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-container">
        <h2>Upcoming Events for {currentDate.toDateString()}</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <p>Please check your API key and calendar permissions.</p>
      </div>
    );
  }

  const currentDateEvents = getEventsForCurrentDate();

  return (
    <div className="calendar-container">
      <h2>Events for {currentDate.toDateString()}</h2>
      
      <div className="events-panel">
        {currentDateEvents.length === 0 ? (
          <p>No events for this date.</p>
        ) : (
          <div className="events-list">
            {currentDateEvents.map((event) => (
              <div key={event.id} className="event-item">
                <h4>{event.summary}</h4>
                <p className="event-time">{formatEventTime(event)}</p>
                {event.location && (
                  <p className="event-location">📍 {event.location}</p>
                )}
                {event.description && (
                  <p className="event-description">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="upcoming-events">
          <h3>Upcoming Events</h3>
          {(() => {
            const upcomingEvents = getUpcomingEvents();
            return upcomingEvents.length === 0 ? (
              <p>No upcoming events.</p>
            ) : (
              <ul className="upcoming-list">
                {upcomingEvents.map((event) => (
                  <li key={event.id} className="upcoming-item">
                    <strong>{event.summary}</strong>
                    <span className="event-time">{formatEventTime(event)}</span>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default CreateCalendar;