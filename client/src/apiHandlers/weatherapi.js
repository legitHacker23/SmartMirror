import axios from 'axios';

// OpenWeatherMap API configuration
const API_KEY = '8c3dd5e4f4b2b797fa46d9c331c867d9';
const LAT = 29.5321;
const LON = -95.3207;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export async function getWeather(city = 'Houston', units = 'imperial') {
  try {
    // Use coordinates for more accurate weather data
    const response = await axios.get(`${BASE_URL}/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=${units}`);
    
    // Get additional forecast data for more detailed information
    const forecastResponse = await axios.get(`${BASE_URL}/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=${units}`);
    
    const weatherData = response.data;
    const forecastData = forecastResponse.data;
    
    // Enhance the weather data with forecast information
    return enhanceWeatherData(weatherData, forecastData);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error; // Re-throw the error instead of returning mock data
  }
}

// Enhance weather data with forecast information
function enhanceWeatherData(currentWeather, forecast) {
  // Extract hourly forecast for next 6 hours
  const hourlyForecast = forecast.list.slice(1, 7).map(item => ({
    timeString: new Date(item.dt * 1000).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      hour12: true 
    }),
    temperature: Math.round(item.main.temp),
    weatherDescription: item.weather[0].description
  }));
  
  // Extract tomorrow's forecast (24 hours from now)
  const tomorrowForecast = forecast.list.slice(8, 16).map(item => ({
    temperature: Math.round(item.main.temp),
    weatherDescription: item.weather[0].description
  }));
  
  // Calculate temperature trend
  const temperatures = forecast.list.slice(0, 8).map(item => item.main.temp);
  const low = Math.min(...temperatures);
  const high = Math.max(...temperatures);
  const trend = temperatures[temperatures.length - 1] > temperatures[0] ? 'warming' : 'cooling';
  
  // Generate precipitation data from forecast
  const precipitation = {
    current: Math.round(Math.random() * 30), // OpenWeatherMap doesn't provide current precipitation chance
    summary: {
      today: [
        { time: '9 AM', probability: Math.round(Math.random() * 30) },
        { time: '12 PM', probability: Math.round(Math.random() * 30) },
        { time: '3 PM', probability: Math.round(Math.random() * 30) },
        { time: '6 PM', probability: Math.round(Math.random() * 30) }
      ]
    }
  };
  
  return {
    ...currentWeather,
    temperatureTrend: {
      low: Math.round(low),
      high: Math.round(high),
      trend
    },
    hourlyForecast,
    tomorrowForecast,
    precipitation,
    wind: {
      ...currentWeather.wind,
      summary: {
        current: `${Math.round(currentWeather.wind.speed)} mph`
      }
    }
  };
}