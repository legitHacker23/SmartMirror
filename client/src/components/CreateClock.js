import React, { useEffect, useState } from 'react';
import { getTime } from '../apiHandlers/clockapi';
import moment from 'moment-timezone';

function CreateClock() {
  // const [time, setTime] = useState('');
  // useEffect(() => {
  //   async function fetchTime() {
  //     const data = await getTime();
  //     console.log("worldTime data: ", data);
  //     const timeDesign = (data.hour + ":" + data.minute + ":" + data.second)
  //     setTime(timeDesign); // set time from API response
  //   }
  //   fetchTime();
  // }, []);
  // return (
  //   <div className="clock" style={{ color: "whitesmoke", textAlign: "center" }} >
  //     <h2 id="clock">{time || 'Loading time...'}</h2>
  //   </div>
  // );
  const [clock, setClock] = useState(moment());

  useEffect(() => {
    const interval = setInterval(() => {
      setClock(moment());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  console.log(moment().format("h:mm:ssA"))

  return( 
    <h1 className= 'createclock'>
      <span className='hour'>{clock.format('hh:mm')}</span>
      <sup className= 'seconds'>{clock.format('ss')}</sup>
      <span className='hour'>{clock.format('a')}</span>
    </h1>
  )  
}

export default CreateClock; 