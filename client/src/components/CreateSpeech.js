import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { getGPT } from "../apiHandlers/gptapi";
import { getWeather } from "../apiHandlers/weatherapi";
import { getCalendar } from "../apiHandlers/calendarapi";
import { getStockPrice, getMultipleStockPrices } from "../apiHandlers/stocksapi";
import { textToSpeech, getVoices, stopSpeaking } from "../apiHandlers/ttsapi";

function CreateSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [llmResponse, setLlmResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(''); // Empty for default voice

  const {
    transcript: liveTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Load available voices on component mount
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const availableVoices = await getVoices();
        setVoices(availableVoices);
      } catch (error) {
        console.error('Failed to load voices:', error);
      }
    };
    
    loadVoices();
  }, []);

  // Update transcript when live transcript changes
  useEffect(() => {
    setTranscript(liveTranscript);
  }, [liveTranscript]);

  const speakText = async (text) => {
    try {
      setIsSpeaking(true);
      
      // Use Web Speech API
      await textToSpeech(text, selectedVoice);
      
    } catch (error) {
      console.error('TTS error:', error);
      // You could add a fallback here if needed
    } finally {
      setIsSpeaking(false);
    }
  };

  const stopSpeakingHandler = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  const startListening = () => {
    setIsListening(true);
    resetTranscript();
    setLlmResponse('');
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
  };

  const stopListening = async () => {
    setIsListening(false);
    SpeechRecognition.stopListening();
    
    // If there's a transcript, send it to the LLM
    if (transcript.trim()) {
      await processTranscript(transcript);
    }
  };

  const processTranscript = async (text) => {
    setIsProcessing(true);
    setLlmResponse('Processing...');

    try {
      let finalPrompt = text;
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
      if (/weather|temperature|forecast|rain|sunny|cloudy|windy/i.test(text.toLowerCase())) {
        try {
          const weather = await getWeather();
          
          let weatherInfo = `Current weather: ${weather.weather[0].description}, ${Math.round(weather.main.temp)}°F (feels like ${Math.round(weather.main.feels_like)}°F). `;
          
          if (weather.temperatureTrend) {
            weatherInfo += `Today's temperature range: ${weather.temperatureTrend.low}°F to ${weather.temperatureTrend.high}°F (${weather.temperatureTrend.trend}). `;
          }
          
          if (weather.hourlyForecast && weather.hourlyForecast.length > 0) {
            const nextHours = weather.hourlyForecast.slice(1, 4);
            weatherInfo += `Next few hours: ${nextHours.map(f => `${f.timeString}: ${f.temperature}°F, ${f.weatherDescription}`).join(', ')}. `;
          }
          
          if (weather.precipitation?.summary?.today?.length > 0) {
            weatherInfo += `Rain chances today: ${weather.precipitation.summary.today.map(p => `${p.time} (${p.probability}%)`).join(', ')}. `;
          }
          
          weatherInfo += `Wind: ${weather.wind?.summary?.current || weather.wind?.speed || 0} mph. `;
          
          contextInfo.push(weatherInfo);
        } catch (err) {
          console.error('Weather fetch failed:', err);
        }
      }

      // Check for stock-related questions
      if (/stock|market|price|trading|invest|portfolio|shares|equity|finance|financial|nasdaq|dow|s&p|spy|aapl|googl|msft|tsla|amzn/i.test(text.toLowerCase())) {
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

      // Check for calendar-related questions
      if (/calendar|event|schedule|meeting|appointment|today|tomorrow|upcoming/i.test(text.toLowerCase())) {
        try {
          const calendar = await getCalendar();
          const currentDate = new Date().toDateString();
          const currentTime = new Date();
          
          const todayEvents = calendar.events.filter(event => {
            const eventDate = event.start.dateTime 
              ? new Date(event.start.dateTime).toDateString()
              : new Date(event.start.date).toDateString();
            return eventDate === currentDate;
          });

          const upcomingEvents = calendar.events.filter(event => {
            const eventDate = event.start.dateTime 
              ? new Date(event.start.dateTime)
              : new Date(event.start.date);
            return eventDate > currentTime;
          }).slice(0, 5);

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

      // Combine all context with the user's question
      if (contextInfo.length > 0) {
        finalPrompt = `Context: ${contextInfo.join(' ')}. User question: ${text}`;
      }

      const response = await getGPT(finalPrompt);
      setLlmResponse(response);
      
      // Automatically speak the response
      await speakText(response);
    } catch (error) {
      console.error('Error processing transcript:', error);
      const errorMessage = 'Sorry, I encountered an error processing your request.';
      setLlmResponse(errorMessage);
      await speakText(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="speech">
        <h2>Speech recognition is not supported in this browser.</h2>
      </div>
    );
  }

  return (
    <div className="speech">
      <div className="voice-controls">
        <button 
          onClick={isListening ? stopListening : startListening}
          className={`voice-button ${isListening ? 'listening' : ''}`}
          disabled={isProcessing}
        >
          {isListening ? '🛑 Stop Listening' : '🎙️ Start Listening'}
        </button>
        
        {isSpeaking && (
          <button 
            onClick={stopSpeakingHandler}
            className="stop-speaking-button"
          >
            🔇 Stop Speaking
          </button>
        )}
        
        {isListening && (
          <button 
            onClick={() => {
              resetTranscript();
              setTranscript('');
            }}
            className="clear-button"
          >
            Clear
          </button>
        )}
      </div>

      {/* Voice Selection */}
      {voices.length > 0 && (
        <div className="voice-selection">
          <label htmlFor="voice-select">Voice: </label>
          <select 
            id="voice-select"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            disabled={isSpeaking}
          >
            {voices.map(voice => (
              <option key={voice.voice_id} value={voice.voice_id}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="transcript-section">
        <h3>You said:</h3>
        <div className="transcript">
          {transcript || 'Start speaking to ask a question...'}
        </div>
      </div>

      {isProcessing && (
        <div className="processing">
          <div className="loading-spinner">⏳</div>
          <p>Processing your request...</p>
        </div>
      )}

      {llmResponse && (
        <div className="response-section">
          <h3>Assistant:</h3>
          <div className="response">
            {llmResponse}
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateSpeech;