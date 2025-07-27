// Web Speech API implementation
export function textToSpeech(text, voiceName = null, onEnd = null) {
  return new Promise((resolve, reject) => {
    // Check if speech synthesis is supported
    if (!window.speechSynthesis) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice if specified
    if (voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => 
        voice.name === voiceName || voice.lang === voiceName
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    // Configure speech parameters
    utterance.rate = 1.0;  // Speed (0.1 to 10)
    utterance.pitch = 1.0; // Pitch (0 to 2)
    utterance.volume = 1.0; // Volume (0 to 1)

    // Event handlers
    utterance.onstart = () => {
      console.log('Speech started');
    };

    utterance.onend = () => {
      console.log('Speech ended');
      if (onEnd) onEnd();
      resolve();
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event.error);
      if (onEnd) onEnd();
      reject(new Error(`Speech error: ${event.error}`));
    };

    // Start speaking
    window.speechSynthesis.speak(utterance);
  });
}

// Get available voices
export function getVoices() {
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    
    // If voices aren't loaded yet, wait for them
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(formatVoices(voices));
      };
    } else {
      resolve(formatVoices(voices));
    }
  });
}

// Format voices for consistency with your existing interface
function formatVoices(voices) {
  return voices.map(voice => ({
    voice_id: voice.name,
    name: `${voice.name} (${voice.lang})`,
    lang: voice.lang,
    default: voice.default
  }));
}

// Stop speaking
export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// Pause speaking
export function pauseSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
}

// Resume speaking
export function resumeSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}
