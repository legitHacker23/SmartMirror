// import { getTime } from '../apiHandlers/clockapi';
// import React from 'react';

// export default () => {
//   async function fetchTime() {
//     const data = await getTime();
//   };
//   return (
//     <div className="clock">
//       <h2 id="clock" style="color:red;"> Time </h2>
//     </div>
//   );
// };

import React, { useEffect, useState } from 'react';
import { getTime } from '../apiHandlers/clockapi';

function CreateClock() {
  const [time, setTime] = useState('');

    async function fetchTime() {
      const data = await getTime();
      console.log("worldTime data: ", data);
      setTime(data.datetime); // set time from API response
    }
    fetchTime();

  return (
    <div className="clock" style={{ color: "whitesmoke", textAlign: "center" }} >
      <h2 id="clock">{time || 'Loading time...'}</h2>
    </div>
  );
}

export default CreateClock; 