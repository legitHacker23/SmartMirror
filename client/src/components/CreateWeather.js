import React, { useEffect, useState } from 'react';
import { getWeather }from '../apiHandlers/weatherapi';

function CreateWeather() {
  const [weather, setWeather] = useState('');
  useEffect(() => {
  async function fetchWeather() {
    const data = await getWeather();
    console.log("Weather data: ", data.list[0].main.temp);
    setWeather(Math.round(data.list[0].main.temp) + '\u00B0' + "F");
  }
  fetchWeather();
}, []);
  return (
    <h2>
      Current Temp: {weather}
    </h2>
  );
};

export default CreateWeather;