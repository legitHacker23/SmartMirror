// Puter.js TTS API implementation
let puterLoaded = false;

// Load Puter.js script
function loadPuterScript() {
  return new Promise((resolve, reject) => {
    if (puterLoaded) {
      resolve();
      return;
    }

    // Check if script is already loaded
    if (window.puter) {
      puterLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.onload = () => {
      puterLoaded = true;
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Puter.js'));
    };
    document.head.appendChild(script);
  });
}

// Puter.js text-to-speech implementation
export async function textToSpeech(text, voiceName = null, onEnd = null) {
  try {
    await loadPuterScript();
    
    // Cancel any ongoing speech
    stopSpeaking();

    // Always use generative engine for best quality
    const currentEngine = "generative";

    // Default options
    const options = {
      language: "en-US",
      engine: currentEngine // Always use generative engine
    };

    // Set voice if specified
    if (voiceName) {
      options.voice = voiceName;
    }

    console.log('Starting Puter.js TTS:', text, 'with engine:', currentEngine);
    
    const audio = await puter.ai.txt2speech(text, options);
    
    // Store the current audio for control
    window.currentPuterAudio = audio;
    
    // Set up event handlers
    audio.addEventListener('ended', () => {
      console.log('Puter.js speech ended');
      window.currentPuterAudio = null;
      if (onEnd) onEnd();
    });

    audio.addEventListener('error', (error) => {
      console.error('Puter.js speech error:', error);
      window.currentPuterAudio = null;
      if (onEnd) onEnd();
    });

    // Handle pause events (when user manually stops)
    audio.addEventListener('pause', () => {
      console.log('Puter.js speech paused');
      window.currentPuterAudio = null;
      if (onEnd) onEnd();
    });

    // Handle abort events
    audio.addEventListener('abort', () => {
      console.log('Puter.js speech aborted');
      window.currentPuterAudio = null;
      if (onEnd) onEnd();
    });

    // Play the audio with error handling for autoplay restrictions
    try {
      await audio.play();
      console.log('Puter.js audio started successfully');
    } catch (playError) {
      console.error('Failed to play audio:', playError);
      
      // If it's an autoplay restriction, try to enable audio context
      if (playError.name === 'NotAllowedError') {
        console.log('Autoplay blocked. User interaction required.');
        
        // Try to resume audio context if it's suspended
        if (audio.context && audio.context.state === 'suspended') {
          try {
            await audio.context.resume();
            await audio.play();
            console.log('Audio context resumed and audio started');
          } catch (resumeError) {
            console.error('Failed to resume audio context:', resumeError);
            throw new Error('Audio playback requires user interaction. Please click or interact with the page first.');
          }
        } else {
          throw new Error('Audio playback requires user interaction. Please click or interact with the page first.');
        }
      } else {
        throw playError;
      }
    }
    
    return audio;
  } catch (error) {
    console.error('Puter.js TTS error:', error);
    throw error;
  }
}

// Get available voices (Puter.js has predefined voices)
export async function getVoices() {
  await loadPuterScript();
  
  // Puter.js supports multiple voices and languages
  const voices = [
    { voice_id: "Joanna", name: "Joanna (en-US)", lang: "en-US", default: true },
    { voice_id: "Matthew", name: "Matthew (en-US)", lang: "en-US", default: false },
    { voice_id: "Salli", name: "Salli (en-US)", lang: "en-US", default: false },
    { voice_id: "Justin", name: "Justin (en-US)", lang: "en-US", default: false },
    { voice_id: "Kendra", name: "Kendra (en-US)", lang: "en-US", default: false },
    { voice_id: "Kevin", name: "Kevin (en-US)", lang: "en-US", default: false },
    { voice_id: "Ivy", name: "Ivy (en-US)", lang: "en-US", default: false },
    { voice_id: "Kimberly", name: "Kimberly (en-US)", lang: "en-US", default: false },
    { voice_id: "Emma_US", name: "Emma (en-US)", lang: "en-US", default: false },
    { voice_id: "Brian", name: "Brian (en-GB)", lang: "en-GB", default: false },
    { voice_id: "Amy", name: "Amy (en-GB)", lang: "en-GB", default: false },
    { voice_id: "Emma_GB", name: "Emma (en-GB)", lang: "en-GB", default: false },
    { voice_id: "Geraint", name: "Geraint (en-GB)", lang: "en-GB", default: false },
    { voice_id: "Lea", name: "Lea (fr-FR)", lang: "fr-FR", default: false },
    { voice_id: "Mathieu", name: "Mathieu (fr-FR)", lang: "fr-FR", default: false },
    { voice_id: "Celine", name: "Celine (fr-FR)", lang: "fr-FR", default: false },
    { voice_id: "Hans", name: "Hans (de-DE)", lang: "de-DE", default: false },
    { voice_id: "Marlene", name: "Marlene (de-DE)", lang: "de-DE", default: false },
    { voice_id: "Vicki", name: "Vicki (de-DE)", lang: "de-DE", default: false },
    { voice_id: "Conchita", name: "Conchita (es-ES)", lang: "es-ES", default: false },
    { voice_id: "Enrique", name: "Enrique (es-ES)", lang: "es-ES", default: false },
    { voice_id: "Giorgio", name: "Giorgio (it-IT)", lang: "it-IT", default: false },
    { voice_id: "Carla", name: "Carla (it-IT)", lang: "it-IT", default: false }
  ];

  return voices;
}

// Stop speaking
export function stopSpeaking() {
  // Puter.js doesn't have a direct stop method, but we can track the current audio
  if (window.currentPuterAudio) {
    window.currentPuterAudio.pause();
    window.currentPuterAudio = null;
  }
}

// Pause speaking
export function pauseSpeaking() {
  if (window.currentPuterAudio) {
    window.currentPuterAudio.pause();
  }
}

// Resume speaking
export function resumeSpeaking() {
  if (window.currentPuterAudio) {
    window.currentPuterAudio.play();
  }
}

// Get available engines
export function getEngines() {
  return [
    { id: "standard", name: "Standard Engine", description: "Good quality speech synthesis" },
    { id: "neural", name: "Neural Engine", description: "Higher quality, more natural-sounding speech" },
    { id: "generative", name: "Generative Engine", description: "Advanced AI for the most human-like speech" }
  ];
}

// Set engine preference
export function setEngine(engine) {
  localStorage.setItem('puter_engine', engine);
}

// Get current engine preference
export function getCurrentEngine() {
  return localStorage.getItem('puter_engine') || 'neural';
}
