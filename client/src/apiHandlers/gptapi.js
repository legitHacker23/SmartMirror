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
    
    // Provide fallback response when chat is not connected
    return "The chat is not connected right now";
  }
};

