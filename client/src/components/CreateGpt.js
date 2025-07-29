import React, { useState } from 'react';
import { getGPT } from "../apiHandlers/gptapi";
import { getWeather } from "../apiHandlers/weatherapi";
import { getCalendar } from "../apiHandlers/calendarapi";
import { getStockPrice, getMultipleStockPrices } from "../apiHandlers/stocksapi";

function CreateGpt() {
  const [prompt, setPrompt] = useState('');
  const [input, setInput] = useState('');
  const [gpt, setGpt] = useState('');

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter' && input.trim()) {
      setPrompt(input);
      setGpt('Loading...');

      let finalPrompt = input;
      let contextInfo = [];

      // Always include current time context
      const now = new Date();
      const currentTimeInfo = `Current time: ${now.toLocaleString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
      })}.`;
      contextInfo.push(currentTimeInfo);

      // Check for weather-related questions
      if (/weather|temperature|forecast|rain|sunny|cloudy|windy/i.test(input)) {
        try {
          const weather = await getWeather();
          
          // Create comprehensive weather context
          let weatherInfo = `Current weather: ${weather.weather[0].description}, ${Math.round(weather.main.temp)}°F (feels like ${Math.round(weather.main.feels_like)}°F). `;
          
          // Add temperature trend
          weatherInfo += `Today's temperature range: ${weather.temperatureTrend.low}°F to ${weather.temperatureTrend.high}°F (${weather.temperatureTrend.trend}). `;
          
          // Add hourly forecast for next few hours
          if (weather.hourlyForecast && weather.hourlyForecast.length > 0) {
            const nextHours = weather.hourlyForecast.slice(1, 4); // Next 3 hours
            weatherInfo += `Next few hours: ${nextHours.map(f => `${f.timeString}: ${f.temperature}°F, ${f.weatherDescription}`).join(', ')}. `;
          }
          
          // Add precipitation forecast
          if (weather.precipitation.summary.today.length > 0) {
            weatherInfo += `Rain chances today: ${weather.precipitation.summary.today.map(p => `${p.time} (${p.probability}%)`).join(', ')}. `;
          }
          
          // Add wind information
          weatherInfo += `Wind: ${weather.wind.summary.current} mph. `;
          
          // Add tomorrow's forecast if available
          if (weather.tomorrowForecast && weather.tomorrowForecast.length > 0) {
            const tomorrowHigh = Math.max(...weather.tomorrowForecast.map(f => f.temperature));
            const tomorrowLow = Math.min(...weather.tomorrowForecast.map(f => f.temperature));
            weatherInfo += `Tomorrow: ${tomorrowLow}°F to ${tomorrowHigh}°F. `;
          }
          
          contextInfo.push(weatherInfo);
        } catch (err) {
          console.error('Weather fetch failed:', err);
        }
      }

      // Check for calendar-related questions
      if (/calendar|event|schedule|meeting|appointment|today|tomorrow|upcoming/i.test(input)) {
        try {
          const calendar = await getCalendar();
          const currentDate = new Date().toDateString();
          const currentTime = new Date();
          
          // Filter events for today
          const todayEvents = calendar.events.filter(event => {
            const eventDate = event.start.dateTime 
              ? new Date(event.start.dateTime).toDateString()
              : new Date(event.start.date).toDateString();
            return eventDate === currentDate;
          });

          // Filter upcoming events (future only)
          const upcomingEvents = calendar.events.filter(event => {
            const eventDate = event.start.dateTime 
              ? new Date(event.start.dateTime)
              : new Date(event.start.date);
            return eventDate > currentTime;
          }).slice(0, 5);

          // Format calendar context with time awareness
          let calendarInfo = `Calendar events for today (${currentDate}): `;
          if (todayEvents.length > 0) {
            calendarInfo += todayEvents.map(event => {
              if (event.start.dateTime) {
                const eventTime = new Date(event.start.dateTime);
                const timeUntil = eventTime - currentTime;
                const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
                const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
                
                let timeInfo = `${eventTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                if (timeUntil > 0) {
                  timeInfo += ` (in ${hoursUntil > 0 ? hoursUntil + 'h ' : ''}${minutesUntil}m)`;
                } else if (timeUntil < 0) {
                  timeInfo += ` (${Math.abs(hoursUntil)}h ${Math.abs(minutesUntil)}m ago)`;
                } else {
                  timeInfo += ` (now)`;
                }
                return `${event.summary} at ${timeInfo}`;
              } else {
                return `${event.summary} (all day)`;
              }
            }).join(', ');
          } else {
            calendarInfo += 'No events scheduled for today.';
          }

          // Add upcoming events with relative time
          if (upcomingEvents.length > 0) {
            calendarInfo += ` Upcoming events: ${upcomingEvents.map(event => {
              const eventDate = event.start.dateTime 
                ? new Date(event.start.dateTime)
                : new Date(event.start.date);
              const daysUntil = Math.floor((eventDate - currentTime) / (1000 * 60 * 60 * 24));
              
              let dateInfo;
              if (daysUntil === 0) {
                dateInfo = 'today';
              } else if (daysUntil === 1) {
                dateInfo = 'tomorrow';
              } else if (daysUntil < 7) {
                dateInfo = `in ${daysUntil} days`;
              } else {
                dateInfo = `on ${eventDate.toLocaleDateString()}`;
              }
              
              return `${event.summary} ${dateInfo}`;
            }).join(', ')}`;
          }

          contextInfo.push(calendarInfo);
        } catch (err) {
          console.error('Calendar fetch failed:', err);
        }
      }

      // Check for stock-related questions
      if (/stock|market|price|trading|invest|portfolio|shares|equity|finance|financial|nasdaq|dow|s&p|spy|aapl|googl|msft|tsla|amzn/i.test(input)) {
        try {
          // Get popular stocks for context
          const popularStocks = ['SPY', 'AAPL', 'GOOGL', 'MSFT'];
          const stockData = await getMultipleStockPrices(popularStocks);
          
          // Filter out failed requests
          const validStocks = stockData.filter(stock => !stock.error);
          
          if (validStocks.length > 0) {
            let stockInfo = `Stock market: `;
            
            // Add market status
            const now = new Date();
            const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
            const dayOfWeek = etTime.getDay();
            const hour = etTime.getHours();
            const minute = etTime.getMinutes();
            const currentTime = hour * 100 + minute;
            
            const isMarketOpen = (dayOfWeek !== 0 && dayOfWeek !== 6) && (currentTime >= 930 && currentTime <= 1600);
            stockInfo += `Market is ${isMarketOpen ? 'open' : 'closed'}. `;
            
            // Add stock data
            const stockSummaries = validStocks.map(stock => {
              const changeIcon = stock.change > 0 ? '↗' : stock.change < 0 ? '↘' : '→';
              const changeText = stock.change > 0 ? '+' : '';
              return `${stock.symbol} $${stock.price.toFixed(2)} ${changeIcon}${changeText}${stock.change.toFixed(2)} (${changeText}${stock.changePercent.toFixed(2)}%)`;
            });
            
            stockInfo += `Key stocks: ${stockSummaries.join(', ')}.`;
            
            contextInfo.push(stockInfo);
          }
        } catch (err) {
          console.error('Stock fetch failed:', err);
        }
      }

      // Combine all context with the user's question
      if (contextInfo.length > 0) {
        finalPrompt = `Context: ${contextInfo.join(' ')}. User question: ${input}`;
      }

      const data = await getGPT(finalPrompt);
      setGpt(data);
    }
  };

  return (
    <div style={{color: "whitesmoke", textAlign: "center"}}>
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask GPT about weather, calendar, or anything..."
        style={{marginBottom: 10}}
      />
      <div>{gpt}</div>
    </div>
  );
};

export default CreateGpt;