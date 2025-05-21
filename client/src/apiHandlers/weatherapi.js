import axios from 'axios';

export async function getWeather() {
  const response = await axios.get("https://api.openweathermap.org/data/2.5/forecast?lat=29.5321&lon=-95.3207&units=imperial&appid=8c3dd5e4f4b2b797fa46d9c331c867d9")
  console.log(response.data);
  return response.data
};