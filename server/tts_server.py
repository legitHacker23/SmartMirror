from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from TTS.api import TTS
import io
import os
import logging
import tempfile
import torch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global TTS instance
tts_model = None

def initialize_tts():
    global tts_model
    try:
        logger.info("Initializing Coqui TTS model...")
        
        # Memory optimizations for Pi 3B
        torch.set_num_threads(1)  # Use single thread
        torch.backends.cudnn.benchmark = False  # Disable cuDNN benchmarking
        
        # Use the lightest model for Pi 3B (300-400MB RAM)
        tts_model = TTS("tts_models/en/ljspeech/fast_pitch")
        
        # Move to CPU to save GPU memory (if any)
        if hasattr(tts_model, 'to'):
            tts_model.to('cpu')
        
        logger.info("Coqui TTS initialized successfully!")
        logger.info(f"Model: tts_models/en/ljspeech/fast_pitch")
        logger.info("Memory optimized for Raspberry Pi 3B")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize Coqui TTS: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'tts_initialized': tts_model is not None,
        'model': 'tts_models/en/ljspeech/fast_pitch'
    })

@app.route('/tts', methods=['POST'])
def generate_speech():
    if not tts_model:
        return jsonify({'error': 'TTS not initialized'}), 500
    
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        logger.info(f"Generating speech for text: {text[:50]}...")
        
        # Generate speech
        wav = tts_model.tts(text)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            import soundfile as sf
            sf.write(temp_file.name, wav, 22050)
            
            # Read the file and send it
            with open(temp_file.name, 'rb') as f:
                audio_data = f.read()
            
            # Clean up temp file
            os.unlink(temp_file.name)
        
        # Return audio as blob
        return send_file(
            io.BytesIO(audio_data),
            mimetype='audio/wav',
            as_attachment=True,
            download_name='speech.wav'
        )
        
    except Exception as e:
        logger.error(f"Error generating speech: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/speakers', methods=['GET'])
def get_speakers():
    if not tts_model:
        return jsonify({'error': 'TTS not initialized'}), 500
    
    try:
        # Get available speakers (voices)
        speakers = tts_model.speakers if hasattr(tts_model, 'speakers') else []
        return jsonify({
            'speakers': speakers,
            'current_speaker': 'default'
        })
    except Exception as e:
        logger.error(f"Error getting speakers: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/models', methods=['GET'])
def get_models():
    try:
        # List available TTS models
        models = TTS.list_models()
        return jsonify({
            'models': models[:10],  # Return first 10 models
            'current_model': 'tts_models/en/ljspeech/fast_pitch'
        })
    except Exception as e:
        logger.error(f"Error getting models: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/change-model', methods=['POST'])
def change_model():
    global tts_model
    try:
        data = request.get_json()
        model_name = data.get('model')
        
        if not model_name:
            return jsonify({'error': 'No model specified'}), 400
        
        logger.info(f"Changing to model: {model_name}")
        tts_model = TTS(model_name)
        
        return jsonify({'success': True, 'model': model_name})
    except Exception as e:
        logger.error(f"Error changing model: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    if initialize_tts():
        logger.info("Starting TTS server on http://localhost:5001")
        logger.info("Model: tts_models/en/ljspeech/fast_pitch (300-400MB RAM)")
        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        logger.error("Failed to initialize TTS. Server not started.") 