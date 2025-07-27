import React, { useEffect, useState } from 'react';
import moment from 'moment-timezone';

function CreateClock() {
  const [clock, setClock] = useState(moment());

  useEffect(() => {
    const interval = setInterval(() => {
      setClock(moment());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="smart-clock">
      <div className="time-display">
        <div className="time-main">
          <span className="hours-minutes">{clock.format('hh:mm')}</span>
          <span className="seconds">{clock.format('ss')}</span>
        </div>
        <div className="date-display">
          <div className="day-of-week">{clock.format('dddd')}</div>
          <div className="date-full">{clock.format('MMMM Do, YYYY')}</div>
        </div>
      </div>
    </div>
  );
}

export default CreateClock; 