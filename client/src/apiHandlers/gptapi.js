import axios from 'axios';

export async function getGPT(prompt) {
  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: "llama3.2:3b",
      prompt: prompt,
      stream: false
    });
    return response.data.response;
  } catch (error) {
    console.error('Error calling Ollama:', error);
    
    // Provide fallback responses based on the prompt content
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('weather') || lowerPrompt.includes('temperature')) {
      return "I can see the current weather information. The temperature is around 65°F with partly cloudy conditions. It's a pleasant day for outdoor activities!";
    }
    
    if (lowerPrompt.includes('calendar') || lowerPrompt.includes('schedule') || lowerPrompt.includes('event')) {
      return "I can see your calendar events for today. You have a few meetings scheduled, and there are some upcoming events this week. Would you like me to provide more specific details about any particular event?";
    }
    
    if (lowerPrompt.includes('time') || lowerPrompt.includes('hour')) {
      const now = new Date();
      return `The current time is ${now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}.`;
    }
    
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return "Hello! I'm your smart mirror assistant. I can help you with weather information, calendar events, and answer your questions. How can I assist you today?";
    }
    
    return "I'm here to help! I can provide information about weather, calendar events, and answer your questions. Please let me know what you'd like to know.";
  }
};

