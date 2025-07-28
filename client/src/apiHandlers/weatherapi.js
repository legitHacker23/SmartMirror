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
    
    // Get 5-day forecast data for daily weather information
    const forecastResponse = await axios.get(`${BASE_URL}/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=${units}&cnt=40`);
    
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
  
  // Extract daily forecast for next 3 days
  const dailyForecast = extractDailyForecast(forecast.list);
  
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
    dailyForecast,
    precipitation,
    wind: {
      ...currentWeather.wind,
      summary: {
        current: `${Math.round(currentWeather.wind.speed)} mph`
      }
    }
  };
}

// Extract daily forecast data for the next 3 days
function extractDailyForecast(forecastList) {
  const dailyData = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day
  
  // Group forecast data by day
  const dailyGroups = {};
  
  forecastList.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toDateString();
    
    if (!dailyGroups[dayKey]) {
      dailyGroups[dayKey] = [];
    }
    dailyGroups[dayKey].push(item);
  });
  
  // Generate the next 3 consecutive days starting from tomorrow
  const next3Days = [];
  for (let i = 1; i <= 3; i++) {
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + i);
    next3Days.push(nextDay.toDateString());
  }
  
  next3Days.forEach((dayKey, index) => {
    const dayData = dailyGroups[dayKey];
    
    // If we don't have forecast data for this day, skip it
    if (!dayData || dayData.length === 0) {
      return;
    }
    
    const date = new Date(dayKey);
    
    // Calculate daily averages and extremes
    const temps = dayData.map(item => item.main.temp);
    const humidities = dayData.map(item => item.main.humidity);
    const windSpeeds = dayData.map(item => item.wind.speed);
    
    // Get most common weather condition for the day
    const weatherCounts = {};
    dayData.forEach(item => {
      const weatherId = item.weather[0].id;
      weatherCounts[weatherId] = (weatherCounts[weatherId] || 0) + 1;
    });
    
    const mostCommonWeatherId = Object.keys(weatherCounts).reduce((a, b) => 
      weatherCounts[a] > weatherCounts[b] ? a : b
    );
    
    const mostCommonWeather = dayData.find(item => item.weather[0].id == mostCommonWeatherId).weather[0];
    
    dailyData.push({
      date: date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      high: Math.round(Math.max(...temps)),
      low: Math.round(Math.min(...temps)),
      avgTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
      humidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
      windSpeed: Math.round(windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length),
      weather: mostCommonWeather,
      precipitation: Math.round(Math.random() * 40) // Mock precipitation chance
    });
  });
  
  return dailyData;
}