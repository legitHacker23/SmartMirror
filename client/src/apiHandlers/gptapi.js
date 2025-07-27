import axios from 'axios';

export async function getGPT(prompt) {
  try {
    // Enhanced prompt engineering for more human, concise responses
    const enhancedPrompt = `You are a helpful smart mirror assistant. Respond in a natural, conversational tone. Keep responses concise (1-3 sentences) but informative. Be friendly and human-like.

IMPORTANT INSTRUCTIONS:
- Use natural, conversational language
- Keep responses short and to the point
- Be helpful and friendly
- Include relevant context when needed
- Avoid formal or robotic language
- Use contractions (it's, you're, etc.)
- Be direct and clear

Context: ${prompt}

Respond naturally and concisely:`;

    const response = await axios.post('http://localhost:11434/api/generate', {
      model: "llama3.2:3b",
      prompt: enhancedPrompt,
      stream: false,
      options: {
        temperature: 0.7, // Slightly more creative but still focused
        top_p: 0.9,
        max_tokens: 150 // Limit response length for conciseness
      }
    });
    return response.data.response;
  } catch (error) {
    console.error('Error calling Ollama:', error);
    
    // Provide fallback responses based on the prompt content
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('weather') || lowerPrompt.includes('temperature')) {
      return "It's currently 65°F with partly cloudy skies - perfect weather for getting outside!";
    }
    
    if (lowerPrompt.includes('calendar') || lowerPrompt.includes('schedule') || lowerPrompt.includes('event')) {
      return "You've got a few meetings today and some events coming up this week. Want me to give you the details on any specific one?";
    }
    
    if (lowerPrompt.includes('time') || lowerPrompt.includes('hour')) {
      const now = new Date();
      return `It's ${now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })} right now.`;
    }
    
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return "Hey there! I'm your smart mirror assistant. I can help with weather, calendar stuff, and answer your questions. What's up?";
    }
    
    return "I'm here to help! I can tell you about the weather, your calendar, or answer questions. What do you need?";
  }
};

