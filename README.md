# Smart Mirror

A smart mirror application with weather, calendar, GPT integration, and voice capabilities.

## Project Structure

- `client/` - React frontend application
- `server/` - Express backend API server

## Setup

### Prerequisites

- Node.js and npm
- Ollama (for GPT functionality)
- ElevenLabs API key (for text-to-speech)

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your API keys:
```
PORT=5000
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

4. Start the server:
```bash
npm start
```

The server will run on `http://localhost:5001`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The client will run on `http://localhost:3000`

## Running the Application

1. Start the backend server first (from the `server` directory):
```bash
npm start
```

2. Start the frontend client (from the `client` directory):
```bash
npm start
```

3. Open your browser to `http://localhost:3000`

## Features

- **Weather Display** - Current weather and forecast
- **Calendar Integration** - Google Calendar events
- **GPT Assistant** - AI-powered responses using Ollama
- **Text-to-Speech** - Voice output using ElevenLabs
- **Wake Word Detection** - Voice activation

## API Endpoints

- `GET /api/weather` - Get weather data
- `GET /api/calendar` - Get calendar events  
- `POST /api/gpt` - Get GPT response
- `POST /api/tts` - Convert text to speech
- `GET /api/voices` - Get available TTS voices 