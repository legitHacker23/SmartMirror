import React, { useState, useEffect, useRef } from 'react';
import { getGPT } from "../apiHandlers/gptapi";
import { getWeather } from "../apiHandlers/weatherapi";
import { getCalendar } from "../apiHandlers/calendarapi";
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

  const speakText = async (text) => {
    try {
      setIsSpeaking(true);
      console.log('Attempting to speak with Puter.js:', text);
      
      // Use Puter.js TTS with default voice and callback to reset after completion
      await textToSpeech(text, null, () => {
        setIsSpeaking(false);
        // Reset recognition only after TTS is completely done
        setTimeout(() => {
          resetRecognition();
        }, 2000); // Small delay to show the response before resetting
      });
      
      console.log('Puter.js audio started playing');
      
    } catch (error) {
      console.error('Puter.js TTS error:', error);
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
    // Stop Puter.js TTS
    stopTTS();
    setIsSpeaking(false);
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
      const currentTimeInfo = `It's ${now.toLocaleString('en-US', { 
        weekday: 'long', 
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
            Say "{wakeWord}" to activate
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
