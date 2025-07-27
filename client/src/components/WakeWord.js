import React, { useState, useEffect, useRef } from 'react';
import { getGPT } from "../apiHandlers/gptapi";
import { getWeather } from "../apiHandlers/weatherapi";
import { getCalendar } from "../apiHandlers/calendarapi";
import { textToSpeech, stopSpeaking as stopTTS, getVoices, getEngines, getCurrentEngine, setEngine } from "../apiHandlers/ttsapi";

function WakeWord() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [llmResponse, setLlmResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [engines, setEngines] = useState([]);
  const [selectedEngine, setSelectedEngine] = useState('neural');
  
  const recognition = useRef(null);
  const wakeWord = 'hey mirror';
  const isActive = useRef(false);
  const currentTranscript = useRef('');
  const inactivityTimer = useRef(null);
  const isProcessingRef = useRef(false);

  const startListening = () => {
    if (recognition.current && !isProcessingRef.current) {
      try {
        recognition.current.start();
      } catch (error) {
        // Handle start errors silently
      }
    }
  };

  const stopListening = () => {
    if (recognition.current) {
      try {
        recognition.current.stop();
      } catch (error) {
        // Handle stop errors silently
      }
    }
  };

  // Load available voices and engines
  const loadVoices = async () => {
    try {
      const availableVoices = await getVoices();
      setVoices(availableVoices);
      // Set default voice to first available voice
      if (availableVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(availableVoices[0].voice_id);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  };

  const loadEngines = () => {
    const availableEngines = getEngines();
    setEngines(availableEngines);
    const currentEngine = getCurrentEngine();
    setSelectedEngine(currentEngine);
  };

  const speakText = async (text) => {
    try {
      setIsSpeaking(true);
      console.log('Attempting to speak with Puter.js:', text);
      
      // Use Puter.js TTS with selected engine
      await textToSpeech(text, selectedVoice, () => {
        setIsSpeaking(false);
      });
      
      console.log('Puter.js audio started playing');
      
    } catch (error) {
      console.error('Puter.js TTS error:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    // Stop Puter.js TTS
    stopTTS();
    setIsSpeaking(false);
  };

  const handleEngineChange = (engine) => {
    setSelectedEngine(engine);
    setEngine(engine);
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';
      
      recognition.current.onstart = () => {
        // Speech recognition started
      };
      
      recognition.current.onresult = (event) => {
        if (isProcessingRef.current) {
          return; // Ignore all speech input while processing
        }
        
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript.toLowerCase();
          } else {
            interimTranscript += event.results[i][0].transcript.toLowerCase();
          }
        }
        
        // Check for wake word in both final and interim transcripts
        const allTranscript = (finalTranscript + ' ' + interimTranscript).toLowerCase();
        
        if (allTranscript.includes(wakeWord.toLowerCase()) && !isActive.current) {
          setWakeWordDetected(true);
          setIsListening(true);
          isActive.current = true;
          setTranscript('');
          currentTranscript.current = '';
          setLlmResponse(''); // Clear any previous response
          setLlmResponse('Listening...');
          
          // Clear any existing inactivity timer
          if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
            inactivityTimer.current = null;
          }
          return;
        }
        
        // If we're in conversation mode, handle speech input
        if (isActive.current) {
          const fullTranscript = finalTranscript || interimTranscript;
          
          if (fullTranscript && !fullTranscript.includes(wakeWord.toLowerCase())) {
            setTranscript(fullTranscript);
            currentTranscript.current = fullTranscript;
            
            // Reset inactivity timer
            resetInactivityTimer();
          }
        }
      };
      
      recognition.current.onerror = (event) => {
        // Handle speech recognition errors silently
      };
      
      recognition.current.onend = () => {
        // Speech recognition ended - only restart if not processing
        if (!isProcessingRef.current) {
          // Restart listening after a short delay
          setTimeout(() => {
            startListening();
          }, 1000);
        }
      };
      
      // Start speech recognition initially
      startListening();
    }
    
    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      if (recognition.current) {
        try {
          recognition.current.stop();
        } catch (error) {
          // Silent cleanup
        }
      }
    };
  }, []);

  useEffect(() => {
    // Load voices and engines when component mounts
    loadVoices();
    loadEngines();
  }, []);

  const resetInactivityTimer = () => {
    // Clear existing timer
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    
    // Set new 2-second timer
    inactivityTimer.current = setTimeout(() => {
      if (isActive.current && currentTranscript.current.trim()) {
        processTranscript(currentTranscript.current);
      }
    }, 2000);
  };

  const resetRecognition = () => {
    // Stop any ongoing speech
    stopSpeaking();
    
    isActive.current = false;
    setIsListening(false);
    setWakeWordDetected(false);
    setTranscript('');
    currentTranscript.current = '';
    setLlmResponse(''); // Clear response when resetting
    setIsProcessing(false); // Make sure processing is also reset
    isProcessingRef.current = false;
    
    // Clear inactivity timer
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    
    // Restart listening for wake word
    startListening();
  };

  const processTranscript = async (text) => {
    setIsProcessing(true);
    isProcessingRef.current = true;
    setLlmResponse('Processing...');

    // Stop listening completely during processing
    stopListening();

    // Clear inactivity timer since we're processing
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }

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

      // Check for weather and calendar related questions - make API calls in parallel
      const needsWeather = /weather|temperature|forecast|rain|sunny|cloudy|windy/i.test(text.toLowerCase());
      const needsCalendar = /calendar|event|schedule|meeting|appointment|today|tomorrow|upcoming/i.test(text.toLowerCase());

      // Make API calls in parallel for better performance
      const apiPromises = [];
      
      if (needsWeather) {
        apiPromises.push(
          getWeather().catch(err => {
            return null;
          })
        );
      }
      
      if (needsCalendar) {
        apiPromises.push(
          getCalendar().catch(err => {
            return null;
          })
        );
      }

      // Wait for all API calls to complete
      const results = await Promise.all(apiPromises);
      let weatherResult = null;
      let calendarResult = null;
      
      if (needsWeather && results.length > 0) {
        weatherResult = results[0];
      }
      if (needsCalendar) {
        calendarResult = needsWeather ? results[1] : results[0];
      }

      // Process weather data
      if (weatherResult) {
        try {
          let weatherInfo = `Current weather: ${weatherResult.weather[0].description}, ${Math.round(weatherResult.main.temp)}°F (feels like ${Math.round(weatherResult.main.feels_like)}°F). `;
          
          if (weatherResult.temperatureTrend) {
            weatherInfo += `Today's temperature range: ${weatherResult.temperatureTrend.low}°F to ${weatherResult.temperatureTrend.high}°F (${weatherResult.temperatureTrend.trend}). `;
          }
          
          if (weatherResult.hourlyForecast && weatherResult.hourlyForecast.length > 0) {
            const nextHours = weatherResult.hourlyForecast.slice(1, 4);
            weatherInfo += `Next few hours: ${nextHours.map(f => `${f.timeString}: ${f.temperature}°F, ${f.weatherDescription}`).join(', ')}. `;
          }
          
          if (weatherResult.precipitation?.summary?.today?.length > 0) {
            weatherInfo += `Rain chances today: ${weatherResult.precipitation.summary.today.map(p => `${p.time} (${p.probability}%)`).join(', ')}. `;
          }
          
          weatherInfo += `Wind: ${weatherResult.wind?.summary?.current || weatherResult.wind?.speed || 0} mph. `;
          
          contextInfo.push(weatherInfo);
        } catch (err) {
          // Silent error handling
        }
      }

      // Process calendar data
      if (calendarResult) {
        try {
          const currentDate = new Date().toDateString();
          const currentTime = new Date();
          
          const todayEvents = calendarResult.events.filter(event => {
            const eventDate = event.start.dateTime 
              ? new Date(event.start.dateTime).toDateString()
              : new Date(event.start.date).toDateString();
            return eventDate === currentDate;
          });

          const upcomingEvents = calendarResult.events.filter(event => {
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
          // Silent error handling
        }
      }

      // Combine all context with the user's question
      if (contextInfo.length > 0) {
        finalPrompt = `Context: ${contextInfo.join(' ')}. User question: ${text}`;
      }

      const response = await getGPT(finalPrompt);
      
      // Force a state update to ensure the response is displayed
      setLlmResponse(response);
      setIsProcessing(false);
      isProcessingRef.current = false;
      
      // Speak the response
      await speakText(response);
      
      // Auto-reset after response - this will restart listening for wake word
      setTimeout(() => {
        resetRecognition();
      }, 8000); // Increased to 8 seconds so you can see the response
      
    } catch (error) {
      const errorMessage = 'Sorry, I encountered an error processing your request.';
      setLlmResponse(errorMessage);
      setIsProcessing(false);
      isProcessingRef.current = false;
      
      // Speak the error message
      await speakText(errorMessage);
      
      setTimeout(() => {
        resetRecognition();
      }, 3000);
    }
  };
  
  return (
    <div className="wake-word-container">
      {!isListening ? (
        <div className="wake-word-status">
          <div className="wake-indicator">
            🎤
          </div>
          <p className="wake-text">
            Say "{wakeWord}" to activate
          </p>
          
          {/* Voice and Engine Selection */}
          <div className="settings-container">
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
            
            {engines.length > 0 && (
              <div className="engine-selection">
                <label htmlFor="engine-select">Engine: </label>
                <select 
                  id="engine-select"
                  value={selectedEngine}
                  onChange={(e) => handleEngineChange(e.target.value)}
                  disabled={isSpeaking}
                >
                  {engines.map(engine => (
                    <option key={engine.id} value={engine.id}>
                      {engine.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="conversation-interface">
          <div className="conversation-status">
            <div className="listening-indicator">🎤</div>
            <p>Listening...</p>
          </div>
          
          {transcript && (
            <div className="transcript-section">
              <h4>You said:</h4>
              <div className="transcript">{transcript}</div>
            </div>
          )}
          
          {isProcessing && (
            <div className="processing">
              <div className="loading-spinner">⏳</div>
              <p>Processing...</p>
            </div>
          )}
          
          {isSpeaking && (
            <div className="speaking">
              <div className="speaking-indicator">🔊</div>
              <p>Speaking with {selectedEngine} engine...</p>
            </div>
          )}
          
          {llmResponse && !isProcessing && llmResponse !== 'Listening...' && (
            <div className="response-section">
              <h4>Assistant:</h4>
              <div className="response">{llmResponse}</div>
            </div>
          )}
          
          <div className="button-container">
            {transcript && !isProcessing && (
              <button 
                onClick={() => processTranscript(currentTranscript.current)}
                className="submit-btn"
              >
                Submit Question
              </button>
            )}
            
            {isSpeaking && (
              <button 
                onClick={stopSpeaking}
                className="stop-speaking-btn"
              >
                🔇 Stop Speaking
              </button>
            )}
            
            <button 
              onClick={resetRecognition}
              className="end-conversation-btn"
            >
              End Conversation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WakeWord;
