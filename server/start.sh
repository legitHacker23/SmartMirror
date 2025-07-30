#!/bin/bash
# Start script for Render deployment
echo "Starting gTTS server..."
gunicorn --config gunicorn_config.py tts_server:app 