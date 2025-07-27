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

  // Format date for display
  const formatEventTime = (event) => {
    if (event.start.dateTime) {
      return new Date(event.start.dateTime).toLocaleString();
    } else if (event.start.date) {
      return new Date(event.start.date).toLocaleDateString();
    }
    return 'No time specified';
  };

  // Filter events for current date
  const getEventsForCurrentDate = () => {
    return events.filter(event => {
      const eventDate = event.start.dateTime 
        ? new Date(event.start.dateTime).toDateString()
        : new Date(event.start.date).toDateString();
      return eventDate === currentDate.toDateString();
    });
  };

  // Filter events for upcoming dates (future events only)
  const getUpcomingEvents = () => {
    const now = new Date();
    return events.filter(event => {
      const eventDate = event.start.dateTime 
        ? new Date(event.start.dateTime)
        : new Date(event.start.date);
      return eventDate > now;
    }).slice(0, 5); // Limit to 5 upcoming events
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
      <h2>Upcoming Events for {currentDate.toDateString()}</h2>
      
      <div className="events-panel">
        <h3>Events for {currentDate.toDateString()}</h3>
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