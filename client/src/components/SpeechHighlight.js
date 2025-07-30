import React, { useState } from 'react';
import { useSpeak, useVoices } from 'react-text-to-speech';

function SpeechHighlight() {
  const [text, setText] = useState("Hello! This is a demonstration of speech highlighting. Each word will be highlighted as it's being spoken.");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const {
    speak,
    stop,
    speaking,
    supported
  } = useSpeak();

  const { voices } = useVoices();

  const handleSpeak = () => {
    if (speaking) {
      stop();
      setIsSpeaking(false);
    } else {
      speak({
        text: text,
        rate: 1,
        pitch: 1,
        volume: 1,
        onStart: () => {
          console.log('Speech started');
          setIsSpeaking(true);
        },
        onEnd: () => {
          console.log('Speech ended');
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setIsSpeaking(false);
        }
      });
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  if (!supported) {
    return (
      <div className="speech-highlight">
        <h3>Speech Highlight Demo</h3>
        <p>Speech synthesis is not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className="speech-highlight">
      <h3>Speech Highlight Demo</h3>
      
      <div className="text-input">
        <label htmlFor="speech-text">Text to speak:</label>
        <textarea
          id="speech-text"
          value={text}
          onChange={handleTextChange}
          rows={4}
          cols={50}
          placeholder="Enter text to speak with highlighting..."
        />
      </div>

      <div className="controls">
        <button 
          onClick={handleSpeak}
          className={`speak-button ${speaking ? 'speaking' : ''}`}
        >
          {speaking ? '🛑 Stop Speaking' : '🔊 Start Speaking'}
        </button>
      </div>

      <div className="highlighted-text">
        <h4>Highlighted Text:</h4>
        <div className="text-display">
          {text}
        </div>
      </div>

      <div className="voice-info">
        <h4>Available Voices:</h4>
        <ul>
          {voices && voices.map((voice, index) => (
            <li key={index}>
              {voice.name} ({voice.lang})
            </li>
          ))}
        </ul>
      </div>

      <style jsx>{`
        .speech-highlight {
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }

        .text-input {
          margin-bottom: 20px;
        }

        .text-input label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        .text-input textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }

        .controls {
          margin-bottom: 20px;
        }

        .speak-button {
          padding: 10px 20px;
          font-size: 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          background-color: #007bff;
          color: white;
          transition: background-color 0.3s;
        }

        .speak-button:hover {
          background-color: #0056b3;
        }

        .speak-button.speaking {
          background-color: #dc3545;
        }

        .highlighted-text {
          margin-bottom: 20px;
        }

        .text-display {
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #f8f9fa;
          font-size: 16px;
          line-height: 1.5;
          min-height: 100px;
        }

        .voice-info {
          margin-top: 20px;
        }

        .voice-info ul {
          list-style: none;
          padding: 0;
        }

        .voice-info li {
          padding: 5px 0;
          border-bottom: 1px solid #eee;
        }
      `}</style>
    </div>
  );
}

export default SpeechHighlight; 