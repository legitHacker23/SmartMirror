import React, { useEffect, useState } from 'react';
import { getCalendar } from '../apiHandlers/calendarapi';

function CreateCalendar() {

  const [calendar, setCalendar] = useState('');
  
  useEffect(() => {
    async function fetchCalendar() {
      const data = getCalendar();
      console.log(data);
      setCalendar(data);
    }
    fetchCalendar();
  },[]);
  return (
    <h2> {calendar} </h2>
  );
};

export default CreateCalendar;