from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from gtts import gTTS
import io
import os
import logging
import tempfile

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'engine': 'gTTS (Google Text-to-Speech)',
        'description': 'Google Text-to-Speech API for high-quality speech synthesis'
    })

@app.route('/tts', methods=['POST'])
def generate_speech():
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        language = data.get('language', 'en')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        logger.info(f"Generating speech for text: {text[:50]}... (language: {language})")
        
        # Create gTTS object
        tts = gTTS(text=text, lang=language, slow=False)
        
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
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name='speech.mp3'
        )
        
    except Exception as e:
        logger.error(f"Error generating speech: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/languages', methods=['GET'])
def get_languages():
    """Get available languages for gTTS"""
    languages = [
        {'code': 'en', 'name': 'English'},
        {'code': 'es', 'name': 'Spanish'},
        {'code': 'fr', 'name': 'French'},
        {'code': 'de', 'name': 'German'},
        {'code': 'it', 'name': 'Italian'},
        {'code': 'pt', 'name': 'Portuguese'},
        {'code': 'ru', 'name': 'Russian'},
        {'code': 'ja', 'name': 'Japanese'},
        {'code': 'ko', 'name': 'Korean'},
        {'code': 'zh', 'name': 'Chinese'},
        {'code': 'ar', 'name': 'Arabic'},
        {'code': 'hi', 'name': 'Hindi'},
        {'code': 'nl', 'name': 'Dutch'},
        {'code': 'sv', 'name': 'Swedish'},
        {'code': 'no', 'name': 'Norwegian'},
        {'code': 'da', 'name': 'Danish'},
        {'code': 'fi', 'name': 'Finnish'},
        {'code': 'pl', 'name': 'Polish'},
        {'code': 'tr', 'name': 'Turkish'},
        {'code': 'el', 'name': 'Greek'}
    ]
    
    return jsonify({
        'languages': languages,
        'current_language': 'en'
    })

@app.route('/voices', methods=['GET'])
def get_voices():
    """Get available voices (gTTS uses different voices per language)"""
    voices = [
        {'id': 'en', 'name': 'English Voice', 'language': 'en'},
        {'id': 'es', 'name': 'Spanish Voice', 'language': 'es'},
        {'id': 'fr', 'name': 'French Voice', 'language': 'fr'},
        {'id': 'de', 'name': 'German Voice', 'language': 'de'},
        {'id': 'it', 'name': 'Italian Voice', 'language': 'it'},
        {'id': 'pt', 'name': 'Portuguese Voice', 'language': 'pt'},
        {'id': 'ru', 'name': 'Russian Voice', 'language': 'ru'},
        {'id': 'ja', 'name': 'Japanese Voice', 'language': 'ja'},
        {'id': 'ko', 'name': 'Korean Voice', 'language': 'ko'},
        {'id': 'zh', 'name': 'Chinese Voice', 'language': 'zh'}
    ]
    
    return jsonify({
        'voices': voices,
        'current_voice': 'en'
    })

@app.route('/change-voice', methods=['POST'])
def change_voice():
    try:
        data = request.get_json()
        voice_id = data.get('voice_id')
        
        if not voice_id:
            return jsonify({'error': 'No voice specified'}), 400
        
        logger.info(f"Voice preference changed to: {voice_id}")
        
        return jsonify({'success': True, 'voice': voice_id})
    except Exception as e:
        logger.error(f"Error changing voice: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting gTTS server on http://localhost:5001")
    logger.info("Engine: Google Text-to-Speech (gTTS)")
    app.run(host='0.0.0.0', port=5001, debug=True) 