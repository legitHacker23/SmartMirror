import React, { useEffect, useState } from 'react';
import { getWeather } from '../apiHandlers/weatherapi';

function CreateWeather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        const data = await getWeather();
        console.log('Weather data received:', data);
        console.log('Weather condition:', data.weather[0]);
        console.log('Weather ID:', data.weather[0].id);
        console.log('Weather description:', data.weather[0].description);
        setWeather(data);
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        setError('Weather unavailable');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    // Fetch weather immediately
    fetchWeather();

    // Set up interval to fetch weather every 5 minutes (300,000 milliseconds)
    const intervalId = setInterval(fetchWeather, 5 * 60 * 1000);

    // Cleanup function to clear the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Get weather icon based on weather condition
  const getWeatherIcon = (weatherId) => {
    console.log('Weather ID received:', weatherId); // Debug log
    
    // Thunderstorm
    if (weatherId >= 200 && weatherId < 300) return '⛈️';
    
    // Drizzle
    if (weatherId >= 300 && weatherId < 400) return '🌦️';
    
    // Rain - more specific mapping
    if (weatherId >= 500 && weatherId < 600) {
      if (weatherId === 500) return '🌦️'; // Light rain
      if (weatherId === 501) return '🌧️'; // Moderate rain
      if (weatherId >= 502 && weatherId <= 531) return '🌧️'; // Heavy rain
      return '🌧️'; // Default rain
    }
    
    // Snow
    if (weatherId >= 600 && weatherId < 700) return '❄️';
    
    // Atmosphere (fog, mist, etc.)
    if (weatherId >= 700 && weatherId < 800) {
      if (weatherId === 701) return '🌫️'; // Mist
      if (weatherId === 711) return '🌫️'; // Smoke
      if (weatherId === 721) return '🌫️'; // Haze
      if (weatherId === 731) return '🌫️'; // Dust/sand
      if (weatherId === 741) return '🌫️'; // Fog
      if (weatherId === 751) return '🌫️'; // Sand
      if (weatherId === 761) return '🌫️'; // Dust
      if (weatherId === 762) return '🌫️'; // Ash
      if (weatherId === 771) return '💨'; // Squall
      if (weatherId === 781) return '🌪️'; // Tornado
      return '🌫️'; // Default atmosphere
    }
    
    // Clear
    if (weatherId === 800) return '☀️';
    
    // Clouds
    if (weatherId >= 801 && weatherId < 900) {
      if (weatherId === 801) return '🌤️'; // Few clouds
      if (weatherId === 802) return '⛅'; // Scattered clouds
      if (weatherId >= 803 && weatherId <= 804) return '☁️'; // Broken/overcast clouds
      return '☁️'; // Default clouds
    }
    
    return '🌤️'; // Default
  };

  // Format time
  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="weather-container">
        <h2>Weather</h2>
        <p>Loading weather data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-container">
        <h2>Weather</h2>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="weather-container">
        <h2>Weather</h2>
        <p>No weather data available</p>
      </div>
    );
  }

  return (
    <div className="weather-container">
      <h2>Weather</h2>
      
      <div className="weather-main">
        <div className="current-weather">
          <div className="weather-icon">
            {getWeatherIcon(weather.weather[0].id)}
          </div>
          <div className="temperature">
            {Math.round(weather.main.temp)}°F
          </div>
          <div className="weather-description">
            {weather.weather[0].description}
          </div>
        </div>

        <div className="weather-details">
          <div className="detail-item">
            <span className="detail-label">Feels Like</span>
            <span className="detail-value">{Math.round(weather.main.feels_like)}°F</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Humidity</span>
            <span className="detail-value">{weather.main.humidity}%</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Wind</span>
            <span className="detail-value">{Math.round(weather.wind.speed)} mph</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Rain Chance</span>
            <span className="detail-value">{Math.round(weather.precipitation?.current || 0)}%</span>
          </div>
        </div>

        <div className="weather-location">
          <span className="location-name">{weather.name}</span>
          {lastUpdated && (
            <span style={{fontSize: '0.8em', color: 'rgba(255,255,255,0.6)'}}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* 3-Day Forecast Tabs */}
        {weather.dailyForecast && weather.dailyForecast.length > 0 && (
          <div className="forecast-tabs">
            {weather.dailyForecast.map((day, index) => (
              <div key={index} className={`forecast-tab forecast-tab-${index + 1}`}>
                <div className="forecast-day">{day.dayName}</div>
                <div className="forecast-icon">
                  {getWeatherIcon(day.weather.id)}
                </div>
                <div className="forecast-temp">
                  <span className="forecast-low">{day.low}°</span>
                  <span className="forecast-high">{day.high}°</span>
                </div>
                <div className="forecast-precipitation">
                  {day.precipitation}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateWeather;