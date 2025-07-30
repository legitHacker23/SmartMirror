// gTTS (Google Text-to-Speech) implementation
const TTS_SERVER_URL = 'http://localhost:5001';

let currentAudio = null;

// gTTS text-to-speech implementation
export async function textToSpeech(text, voiceName = null, onEnd = null) {
  try {
    // Cancel any ongoing speech
    stopSpeaking();

    console.log('=== gTTS DEBUG ===');
    console.log('Text type:', typeof text);
    console.log('Text length:', text ? text.length : 'null/undefined');
    console.log('Text content:', text);
    console.log('Text preview (first 100 chars):', text ? text.substring(0, 100) : 'null/undefined');
    console.log('Voice:', voiceName);
    console.log('=====================');

    console.log('Starting gTTS:', text);
    
    // Determine language from voice name
    const language = voiceName ? voiceName.split('-')[0] : 'en';
    
    // Make request to gTTS server
    const response = await fetch(`${TTS_SERVER_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        language: language
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    // Get audio blob
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Create audio element
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    
    // Set up event handlers
    audio.addEventListener('ended', () => {
      console.log('gTTS ended');
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      if (onEnd) onEnd();
    });

    audio.addEventListener('error', (error) => {
      console.error('gTTS error:', error);
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      if (onEnd) onEnd();
    });

    audio.addEventListener('pause', () => {
      console.log('gTTS paused');
    });

    audio.addEventListener('play', () => {
      console.log('gTTS started');
    });

    // Play the audio
    await audio.play();
    console.log('gTTS audio started successfully');
    
    return audio;
  } catch (error) {
    console.error('gTTS error:', error);
    throw error;
  }
}

// Get available voices from gTTS server
export async function getVoices() {
  try {
    const response = await fetch(`${TTS_SERVER_URL}/voices`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.voices.map(voice => ({
      id: voice.id,
      name: voice.name,
      lang: voice.language,
      default: voice.id === 'en'
    }));
  } catch (error) {
    console.error('Error getting voices from gTTS server:', error);
    // Return default voices if server is not available
    return [
      { id: "en", name: "English Voice", lang: "en", default: true },
      { id: "es", name: "Spanish Voice", lang: "es", default: false },
      { id: "fr", name: "French Voice", lang: "fr", default: false },
      { id: "de", name: "German Voice", lang: "de", default: false }
    ];
  }
}

// Get available languages from gTTS server
export async function getLanguages() {
  try {
    const response = await fetch(`${TTS_SERVER_URL}/languages`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.languages;
  } catch (error) {
    console.error('Error getting languages from gTTS server:', error);
    // Return default languages if server is not available
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' }
    ];
  }
}

// Stop speaking
export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

// Pause speaking
export function pauseSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
  }
}

// Resume speaking
export function resumeSpeaking() {
  if (currentAudio) {
    currentAudio.play();
  }
}

// Change speaker (voice)
export async function changeSpeaker(speakerId) {
  try {
    const response = await fetch(`${TTS_SERVER_URL}/change-voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        voice_id: speakerId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('Voice changed to:', speakerId);
    return { message: `Voice changed to ${speakerId}`, voice: { id: speakerId } };
  } catch (error) {
    console.error('Error changing voice:', error);
    throw error;
  }
}

// Check TTS health (gTTS server availability)
export async function checkTTSHealth() {
  try {
    const response = await fetch(`${TTS_SERVER_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return { 
      status: 'healthy', 
      engine: 'gTTS',
      available: true,
      description: data.description || 'Google Text-to-Speech API'
    };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message,
      available: false,
      description: 'gTTS server not available'
    };
  }
}

// Get available engines
export function getEngines() {
  return [
    { 
      id: "gtts", 
      name: "Google Text-to-Speech (gTTS)", 
      description: "High-quality speech synthesis using Google's TTS API" 
    }
  ];
}

// Set engine preference
export function setEngine(engine) {
  localStorage.setItem('tts_engine', engine);
}

// Get current engine preference
export function getCurrentEngine() {
  return localStorage.getItem('tts_engine') || 'gtts';
}

// Export placeholder hooks for compatibility (not used with gTTS)
export const useSpeak = () => ({ speak: textToSpeech });
export const useVoices = () => ({ voices: [], loading: false });
