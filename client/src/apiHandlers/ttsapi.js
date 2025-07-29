// Google TTS Local Server API implementation
let currentAudio = null;

// Local Google TTS text-to-speech implementation
export async function textToSpeech(text, voiceName = null, onEnd = null) {
  try {
    // Cancel any ongoing speech
    stopSpeaking();

    console.log('=== Google TTS DEBUG ===');
    console.log('Text type:', typeof text);
    console.log('Text length:', text ? text.length : 'null/undefined');
    console.log('Text content:', text);
    console.log('Text preview (first 100 chars):', text ? text.substring(0, 100) : 'null/undefined');
    console.log('=====================');

    console.log('Starting Google TTS:', text);
    
    // Call local TTS server
    const response = await fetch('http://localhost:5001/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google TTS server error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    // Get audio blob
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Create audio element
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    
    // Set up event handlers
    audio.addEventListener('ended', () => {
      console.log('Google TTS speech ended');
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      if (onEnd) onEnd();
    });

    audio.addEventListener('error', (error) => {
      console.error('Google TTS speech error:', error);
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      if (onEnd) onEnd();
    });

    audio.addEventListener('pause', () => {
      console.log('Google TTS speech paused');
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      if (onEnd) onEnd();
    });

    audio.addEventListener('abort', () => {
      console.log('Google TTS speech aborted');
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      if (onEnd) onEnd();
    });

    // Play the audio with error handling for autoplay restrictions
    try {
      await audio.play();
      console.log('Google TTS audio started successfully');
    } catch (playError) {
      console.error('Failed to play Google TTS audio:', playError);
      
      // If it's an autoplay restriction, try to enable audio context
      if (playError.name === 'NotAllowedError') {
        console.log('Autoplay blocked. User interaction required.');
        throw new Error('Audio playback requires user interaction. Please click or interact with the page first.');
      } else {
        throw playError;
      }
    }
    
    return audio;
  } catch (error) {
    console.error('Google TTS error:', error);
    throw error;
  }
}

// Get available voices from Coqui TTS server
export async function getVoices() {
  try {
    const response = await fetch('http://localhost:5001/speakers');
    
    if (!response.ok) {
      throw new Error(`Failed to get speakers: ${response.status}`);
    }
    
    const data = await response.json();
    return data.speakers || [];
  } catch (error) {
    console.error('Error getting speakers:', error);
    // Return default speakers if server is not available
    return [
      { id: "male_1", name: "Male Voice 1" },
      { id: "female_1", name: "Female Voice 1" },
      { id: "male_2", name: "Male Voice 2" },
      { id: "female_2", name: "Female Voice 2" }
    ];
  }
}

// Stop speaking
export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
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

// Change speaker
export async function changeSpeaker(speakerId) {
  try {
    const response = await fetch('http://localhost:5001/change-speaker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ speaker_id: speakerId })
    });

    if (!response.ok) {
      throw new Error(`Failed to change speaker: ${response.status}`);
    }

    const data = await response.json();
    console.log('Speaker changed:', data.message);
    return data;
  } catch (error) {
    console.error('Error changing speaker:', error);
    throw error;
  }
}

// Check TTS server health
export async function checkTTSHealth() {
  try {
    const response = await fetch('http://localhost:5001/health');
    
    if (!response.ok) {
      return { status: 'unhealthy', error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

// Get available engines
export function getEngines() {
  return [
    { id: "coqui", name: "Coqui TTS Local", description: "High quality local TTS with fast_pitch model" }
  ];
}

// Set engine preference
export function setEngine(engine) {
  localStorage.setItem('tts_engine', engine);
}

// Get current engine preference
export function getCurrentEngine() {
  return localStorage.getItem('tts_engine') || 'coqui';
}
