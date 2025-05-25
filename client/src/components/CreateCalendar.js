import React, { useEffect, useState } from 'react';
import { getCalendar } from '../apiHandlers/calendarapi';
import Calendar from 'react-calendar';

  // const [calendar, setCalendar] = useState('');
  // useEffect(() => {
  //   async function fetchCalendar() {
  //     const data = await getCalendar();
  //   }
  //   fetchCalendar();
  // }, []);

  const ReactCalendar = () => {
    const [date, setDate] = useState(new Date());

    const onChange = date => {
      setDate(date);
    };

    return (
      <div>
        <Calendar onChange={onChange} value={date} />
      </div>
    );
  };

export default ReactCalendar;