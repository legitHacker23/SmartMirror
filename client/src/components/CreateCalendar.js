import React, { useState } from 'react';
import { getCalendar } from '../apiHandlers/calendarapi';

function createCalendar() {

  const [calendar, setcalendar] = useState(getCalendar());

  return (
    <h1 style={{color: 'whitesmoke', textAlign: 'right'}}> {calendar} </h1>
  );
};

export default createCalendar;