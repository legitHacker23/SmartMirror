import React, { useState, useEffect, useRef } from 'react';
import { getGPT } from "../apiHandlers/gptapi";
import { getWeather } from "../apiHandlers/weatherapi";
import { getCalendar } from "../apiHandlers/calendarapi";
import { getStockPrice, getMultipleStockPrices } from "../apiHandlers/stocksapi";
import { textToSpeech, stopSpeaking as stopTTS } from "../apiHandlers/ttsapi";

function WakeWord() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [llmResponse, setLlmResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognition = useRef(null);
  const wakeWord = 'hey mirror';
  const isActive = useRef(false);
  const currentTranscript = useRef('');
  const inactivityTimer = useRef(null);
  const wakeWordTimeout = useRef(null); // New timer for wake word timeout
  const isProcessingRef = useRef(false);

  const startListening = () => {
    console.log('Attempting to start listening...');
    console.log('Is processing:', isProcessingRef.current);
    console.log('Is active:', isActive.current);
    
    // Don't start if already processing or in active conversation
    if (isProcessingRef.current || isActive.current) {
      console.log('Cannot start listening - processing or in active conversation');
      return;
    }
    
    if (recognition.current) {
      try {
        recognition.current.start();
        console.log('✅ Listening started successfully');
      } catch (error) {
        console.error('❌ Failed to start listening:', error);
        // Don't immediately retry on error - wait longer
        setTimeout(() => {
          if (!isProcessingRef.current && !isActive.current) {
            console.log('Retrying speech recognition after error...');
            startListening();
          }
        }, 3000);
      }
    } else {
      console.log('❌ Recognition object not available');
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

  const speakText = async (text) => {
    try {
      setIsSpeaking(true);
      console.log('Attempting to speak with Coqui TTS:', text);
      
      // Use Coqui TTS with default voice and callback to reset after completion
      await textToSpeech(text, null, () => {
        setIsSpeaking(false);
        // Reset recognition only after TTS is completely done
        setTimeout(() => {
          resetRecognition();
        }, 2000); // Small delay to show the response before resetting
      });
      
      console.log('Coqui TTS audio started playing');
      
    } catch (error) {
      console.error('Coqui TTS error:', error);
      setIsSpeaking(false);
      
      // Handle autoplay restriction error
      if (error.message && error.message.includes('user interaction')) {
        setLlmResponse(prev => prev + '\n\n⚠️ Audio blocked: Please click anywhere on the page to enable audio playback.');
        // Reset recognition after showing the error message
        setTimeout(() => {
          resetRecognition();
        }, 5000); // Give user time to read the error message
      } else {
        // Reset recognition on other errors
        setTimeout(() => {
          resetRecognition();
        }, 3000);
      }
    }
  };

  const stopSpeaking = () => {
    // Stop Coqui TTS
    stopTTS();
    setIsSpeaking(false);
  };

  // Function to start the 5-second wake word timeout
  const startWakeWordTimeout = () => {
    // Clear any existing wake word timeout
    if (wakeWordTimeout.current) {
      clearTimeout(wakeWordTimeout.current);
    }
    
    // Set 5-second timeout
    wakeWordTimeout.current = setTimeout(() => {
      console.log('Wake word timeout - no speech detected for 5 seconds');
      resetRecognition();
    }, 5000); // 5 seconds
  };

  // Function to reset the wake word timeout when user speaks
  const resetWakeWordTimeout = () => {
    if (wakeWordTimeout.current) {
      clearTimeout(wakeWordTimeout.current);
      wakeWordTimeout.current = null;
    }
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
          
          // Start the 5-second wake word timeout
          startWakeWordTimeout();
          return;
        }
        
        // If we're in conversation mode, handle speech input
        if (isActive.current) {
          const fullTranscript = finalTranscript || interimTranscript;
          
          if (fullTranscript && !fullTranscript.includes(wakeWord.toLowerCase())) {
            setTranscript(fullTranscript);
            currentTranscript.current = fullTranscript;
            
            // Reset the wake word timeout when user speaks
            resetWakeWordTimeout();
            
            // Reset inactivity timer for processing
            resetInactivityTimer();
          }
        }
      };
      
      recognition.current.onerror = (event) => {
        // Handle speech recognition errors silently
      };
      
      recognition.current.onend = () => {
        console.log('Speech recognition ended');
        
        // ONLY restart if we're not processing AND not in active conversation
        if (!isProcessingRef.current && !isActive.current) {
          console.log('Restarting speech recognition for wake word detection...');
          // Add a longer delay to prevent rapid cycling
          setTimeout(() => {
            // Double-check we're still not processing or active before restarting
            if (!isProcessingRef.current && !isActive.current) {
              startListening();
            }
          }, 2000); // Increased delay to 2 seconds
        } else {
          console.log('NOT restarting - processing or in active conversation');
        }
      };
      
      // Start speech recognition initially
      startListening();
    }
    
    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      if (wakeWordTimeout.current) {
        clearTimeout(wakeWordTimeout.current);
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
    // Add user interaction handler to enable audio
    const enableAudio = () => {
      // Create a silent audio context to enable audio playback
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        console.log('Audio context enabled by user interaction');
      } catch (error) {
        console.log('Audio context already enabled or not supported');
      }
    };
    
    // Enable audio on first user interaction
    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('touchstart', enableAudio, { once: true });
    
    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
  }, []);

  const resetInactivityTimer = () => {
    // Clear existing timer
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    
    // Set new 2-second timer for processing
    inactivityTimer.current = setTimeout(() => {
      if (isActive.current && currentTranscript.current.trim()) {
        processTranscript(currentTranscript.current);
      }
    }, 2000);
  };

  const resetRecognition = () => {
    console.log('Resetting recognition...');
    
    // Stop any ongoing speech
    stopSpeaking();
    
    // Stop recognition first
    if (recognition.current) {
      try {
        recognition.current.stop();
      } catch (error) {
        console.log('Error stopping recognition during reset:', error);
      }
    }
    
    // Reset all state
    isActive.current = false;
    setIsListening(false);
    setWakeWordDetected(false);
    setTranscript('');
    currentTranscript.current = '';
    setLlmResponse('');
    setIsProcessing(false);
    isProcessingRef.current = false;
    
    // Clear all timers
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    if (wakeWordTimeout.current) {
      clearTimeout(wakeWordTimeout.current);
      wakeWordTimeout.current = null;
    }
    
    // Wait a bit before restarting to prevent rapid cycling
    setTimeout(() => {
      if (!isProcessingRef.current && !isActive.current) {
        console.log('Restarting recognition after reset...');
        startListening();
      }
    }, 1000);
  };

  const processTranscript = async (text) => {
    setIsProcessing(true);
    isProcessingRef.current = true;
    setLlmResponse('Processing...');

    // Stop listening completely during processing
    stopListening();

    // Clear all timers since we're processing
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    if (wakeWordTimeout.current) {
      clearTimeout(wakeWordTimeout.current);
      wakeWordTimeout.current = null;
    }

    try {
      let finalPrompt = text;
      let contextInfo = [];

      // Always include current time context
      const now = new Date();
      const currentTimeInfo = `It's ${now.toLocaleString('en-US', { 
        weekday: 'long', 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
      })}.`;
      contextInfo.push(currentTimeInfo);

      // Check for weather, calendar, and stock related questions - make API calls in parallel
      const needsWeather = /weather|temperature|forecast|rain|sunny|cloudy|windy/i.test(text.toLowerCase());
      const needsCalendar = /calendar|event|schedule|meeting|appointment|today|tomorrow|upcoming/i.test(text.toLowerCase());
      const needsStocks = /stock|market|price|trading|invest|portfolio|shares|equity|finance|financial|nasdaq|dow|s&p|spy|aapl|googl|msft|tsla|amzn/i.test(text.toLowerCase());

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
      
      if (needsStocks) {
        apiPromises.push(
          getMultipleStockPrices(['SPY', 'AAPL', 'GOOGL', 'MSFT']).catch(err => {
            return null;
          })
        );
      }

      // Wait for all API calls to complete
      const results = await Promise.all(apiPromises);
      let weatherResult = null;
      let calendarResult = null;
      let stocksResult = null;
      
      let resultIndex = 0;
      if (needsWeather && results.length > resultIndex) {
        weatherResult = results[resultIndex++];
      }
      if (needsCalendar && results.length > resultIndex) {
        calendarResult = results[resultIndex++];
      }
      if (needsStocks && results.length > resultIndex) {
        stocksResult = results[resultIndex++];
      }

      // Process weather data - more concise
      if (weatherResult) {
        try {
          let weatherInfo = `${Math.round(weatherResult.main.temp)}°F, ${weatherResult.weather[0].description}`;
          
          if (weatherResult.temperatureTrend) {
            weatherInfo += ` (feels like ${Math.round(weatherResult.main.feels_like)}°F). High today: ${weatherResult.temperatureTrend.high}°F`;
          }
          
          if (weatherResult.hourlyForecast && weatherResult.hourlyForecast.length > 0) {
            const nextHours = weatherResult.hourlyForecast.slice(1, 3);
            weatherInfo += `. Next few hours: ${nextHours.map(f => `${f.timeString}: ${f.temperature}°F`).join(', ')}`;
          }
          
          if (weatherResult.precipitation?.summary?.today?.length > 0) {
            const rainChances = weatherResult.precipitation.summary.today.slice(0, 2);
            weatherInfo += `. Rain chances: ${rainChances.map(p => `${p.time} (${p.probability}%)`).join(', ')}`;
          }
          
          contextInfo.push(`Weather: ${weatherInfo}`);
        } catch (err) {
          // Silent error handling
        }
      }

      // Process calendar data - more concise
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
          }).slice(0, 3);

          let calendarInfo = `Today's events: `;
          if (todayEvents.length > 0) {
            calendarInfo += todayEvents.slice(0, 3).map(event => {
              if (event.start.dateTime) {
                const eventTime = new Date(event.start.dateTime);
                return `${event.summary} at ${eventTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
              } else {
                return `${event.summary} (all day)`;
              }
            }).join(', ');
          } else {
            calendarInfo += 'none scheduled';
          }

          if (upcomingEvents.length > 0) {
            calendarInfo += `. Upcoming: ${upcomingEvents.map(event => {
              const eventDate = event.start.dateTime 
                ? new Date(event.start.dateTime)
                : new Date(event.start.date);
              const daysUntil = Math.floor((eventDate - currentTime) / (1000 * 60 * 60 * 24));
              
              let dateInfo;
              if (daysUntil === 0) dateInfo = 'today';
              else if (daysUntil === 1) dateInfo = 'tomorrow';
              else if (daysUntil < 7) dateInfo = `in ${daysUntil} days`;
              else dateInfo = `on ${eventDate.toLocaleDateString()}`;
              
              return `${event.summary} ${dateInfo}`;
            }).join(', ')}`;
          }

          contextInfo.push(calendarInfo);
        } catch (err) {
          // Silent error handling
        }
      }

      // Process stock data
      if (stocksResult) {
        try {
          const validStocks = stocksResult.filter(stock => !stock.error);
          
          if (validStocks.length > 0) {
            // Add market status
            const now = new Date();
            const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
            const dayOfWeek = etTime.getDay();
            const hour = etTime.getHours();
            const minute = etTime.getMinutes();
            const currentTime = hour * 100 + minute;
            
            const isMarketOpen = (dayOfWeek !== 0 && dayOfWeek !== 6) && (currentTime >= 930 && currentTime <= 1600);
            
            // Create concise stock summary
            const stockSummaries = validStocks.slice(0, 3).map(stock => {
              const changeIcon = stock.change > 0 ? '↗' : stock.change < 0 ? '↘' : '→';
              const changeText = stock.change > 0 ? '+' : '';
              return `${stock.symbol} $${stock.price.toFixed(2)} ${changeIcon}${changeText}${stock.changePercent.toFixed(1)}%`;
            });
            
            contextInfo.push(`Market ${isMarketOpen ? 'open' : 'closed'}: ${stockSummaries.join(', ')}`);
          }
        } catch (err) {
          // Silent error handling
        }
      }

      // Combine all context with the user's question - more concise
      if (contextInfo.length > 0) {
        finalPrompt = `${contextInfo.join('. ')}. Question: ${text}`;
      }

      const response = await getGPT(finalPrompt);
      
      // Force a state update to ensure the response is displayed
      setLlmResponse(response);
      setIsProcessing(false);
      isProcessingRef.current = false;
      
      // Speak the response
      await speakText(response);
      
      // Auto-reset after response - this will restart listening for wake word
      // setTimeout(() => {
      //   resetRecognition();
      // }, 8000); // Increased to 8 seconds so you can see the response
      
    } catch (error) {
      const errorMessage = 'Sorry, I encountered an error processing your request.';
      setLlmResponse(errorMessage);
      setIsProcessing(false);
      isProcessingRef.current = false;
      
      // Speak the error message
      await speakText(errorMessage);
      
      // The speakText function will handle the reset timing
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
            Say "{wakeWord}" to activate mirror assistant
          </p>
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
              <p>Speaking...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WakeWord;
