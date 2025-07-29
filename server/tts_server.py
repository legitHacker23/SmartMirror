from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from gtts import gTTS
import io
import logging
import tempfile
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.route('/tts', methods=['POST'])
def generate_speech():
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        logger.info(f"Generating speech for text: {text[:50]}...")
        
        # Generate speech using Google TTS
        tts = gTTS(text=text, lang='en', slow=False)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
            tts.save(temp_file.name)
            
            # Read the file and send it
            with open(temp_file.name, 'rb') as f:
                audio_data = f.read()
            
            # Clean up temp file
            os.unlink(temp_file.name)
        
        # Return audio as blob
        return send_file(
            io.BytesIO(audio_data),
            mimetype='audio/mp3',
            as_attachment=True,
            download_name='speech.mp3'
        )
        
    except Exception as e:
        logger.error(f"Error generating speech: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Google TTS server on http://localhost:5001")
    logger.info("Using gTTS - No API key required!")
    app.run(host='0.0.0.0', port=5001, debug=True) 