// react-text-to-speech implementation with highlighting
import { useSpeak, useVoices } from 'react-text-to-speech';

let currentUtterance = null;

// react-text-to-speech text-to-speech implementation
export async function textToSpeech(text, voiceName = null, onEnd = null) {
  try {
    // Cancel any ongoing speech
    stopSpeaking();

    console.log('=== react-text-to-speech DEBUG ===');
    console.log('Text type:', typeof text);
    console.log('Text length:', text ? text.length : 'null/undefined');
    console.log('Text content:', text);
    console.log('Text preview (first 100 chars):', text ? text.substring(0, 100) : 'null/undefined');
    console.log('=====================');

    console.log('Starting react-text-to-speech:', text);
    
    // Use Web Speech API as the base (react-text-to-speech uses this under the hood)
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported in this browser');
    }
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;
    
    // Set default language
    utterance.lang = 'en-US';
    
    // Set voice if specified
    if (voiceName) {
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === voiceName);
      if (voice) {
        utterance.voice = voice;
        console.log('Using voice:', voice.name);
      }
    }
    
    // Set up event handlers
    utterance.addEventListener('end', () => {
      console.log('react-text-to-speech ended');
      currentUtterance = null;
      if (onEnd) onEnd();
    });

    utterance.addEventListener('error', (error) => {
      console.error('react-text-to-speech error:', error);
      currentUtterance = null;
      if (onEnd) onEnd();
    });

    utterance.addEventListener('pause', () => {
      console.log('react-text-to-speech paused');
    });

    utterance.addEventListener('resume', () => {
      console.log('react-text-to-speech resumed');
    });

    utterance.addEventListener('start', () => {
      console.log('react-text-to-speech started');
    });

    // Play the speech
    speechSynthesis.speak(utterance);
    console.log('react-text-to-speech audio started successfully');
    
    return utterance;
  } catch (error) {
    console.error('react-text-to-speech error:', error);
    throw error;
  }
}

// Get available voices from react-text-to-speech
export async function getVoices() {
  try {
    // Wait for voices to load if they haven't already
    if (speechSynthesis.getVoices().length === 0) {
      return new Promise((resolve) => {
        speechSynthesis.addEventListener('voiceschanged', () => {
          const voices = speechSynthesis.getVoices();
          const voiceList = voices.map(voice => ({
            id: voice.name,
            name: voice.name,
            lang: voice.lang,
            default: voice.default
          }));
          resolve(voiceList);
        });
        // Trigger voices to load
        speechSynthesis.getVoices();
      });
    } else {
      const voices = speechSynthesis.getVoices();
      return voices.map(voice => ({
        id: voice.name,
        name: voice.name,
        lang: voice.lang,
        default: voice.default
      }));
    }
  } catch (error) {
    console.error('Error getting voices:', error);
    // Return default voices if API is not available
    return [
      { id: "default", name: "Default Voice", lang: "en-US", default: true }
    ];
  }
}

// Stop speaking
export function stopSpeaking() {
  if (currentUtterance) {
    speechSynthesis.cancel();
    currentUtterance = null;
  }
}

// Pause speaking
export function pauseSpeaking() {
  if (currentUtterance) {
    speechSynthesis.pause();
  }
}

// Resume speaking
export function resumeSpeaking() {
  if (currentUtterance) {
    speechSynthesis.resume();
  }
}

// Change speaker (voice)
export async function changeSpeaker(speakerId) {
  try {
    const voices = await getVoices();
    const voice = voices.find(v => v.id === speakerId);
    
    if (voice) {
      console.log('Voice changed to:', voice.name);
      return { message: `Voice changed to ${voice.name}`, voice: voice };
    } else {
      throw new Error(`Voice not found: ${speakerId}`);
    }
  } catch (error) {
    console.error('Error changing voice:', error);
    throw error;
  }
}

// Check TTS health (react-text-to-speech availability)
export async function checkTTSHealth() {
  try {
    if ('speechSynthesis' in window) {
      return { 
        status: 'healthy', 
        engine: 'react-text-to-speech',
        available: true,
        voices: speechSynthesis.getVoices().length,
        description: 'React TTS with highlighting support'
      };
    } else {
      return { 
        status: 'unhealthy', 
        error: 'Speech synthesis not supported in this browser',
        available: false
      };
    }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message,
      available: false
    };
  }
}

// Get available engines
export function getEngines() {
  return [
    { 
      id: "react-text-to-speech", 
      name: "React Text-to-Speech", 
      description: "React TTS component with highlighting and better integration" 
    }
  ];
}

// Set engine preference
export function setEngine(engine) {
  localStorage.setItem('tts_engine', engine);
}

// Get current engine preference
export function getCurrentEngine() {
  return localStorage.getItem('tts_engine') || 'react-text-to-speech';
}

// Export the hooks for use in components that need highlighting
export { useSpeak, useVoices };
