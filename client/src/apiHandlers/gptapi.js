import { GoogleGenAI } from "@google/genai";

// Rate limit tracking
let dailyRequestCount = 0;
let lastResetDate = new Date().toDateString();

// Free tier limits (approximate - check Google's current limits)
const FREE_TIER_DAILY_LIMIT = 15000; // requests per day
const WARNING_THRESHOLD = 0.8; // Warn at 80% of limit

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Initialize usage tracking from localStorage
function initializeUsageTracking() {
  const saved = localStorage.getItem('gemini_usage');
  if (saved) {
    const usage = JSON.parse(saved);
    const today = new Date().toDateString();
    
    if (usage.date === today) {
      dailyRequestCount = usage.count;
      lastResetDate = today;
    } else {
      // Reset counter for new day
      dailyRequestCount = 0;
      lastResetDate = today;
      saveUsageTracking();
    }
  }
}

// Save usage tracking to localStorage
function saveUsageTracking() {
  const usage = {
    date: lastResetDate,
    count: dailyRequestCount
  };
  localStorage.setItem('gemini_usage', JSON.stringify(usage));
}

// Check if we should warn about usage
function checkUsageWarning() {
  const usagePercentage = dailyRequestCount / FREE_TIER_DAILY_LIMIT;
  
  if (usagePercentage >= WARNING_THRESHOLD) {
    const remaining = FREE_TIER_DAILY_LIMIT - dailyRequestCount;
    console.warn(`⚠️ Gemini API Usage Warning: ${dailyRequestCount}/${FREE_TIER_DAILY_LIMIT} requests used today. ${remaining} requests remaining.`);
    
    // Show user-friendly warning
    if (usagePercentage >= 0.95) {
      return `⚠️ Warning: You're approaching the daily API limit (${dailyRequestCount}/${FREE_TIER_DAILY_LIMIT}). Consider upgrading your plan.`;
    } else if (usagePercentage >= WARNING_THRESHOLD) {
      return `⚠️ Note: You've used ${dailyRequestCount}/${FREE_TIER_DAILY_LIMIT} API requests today.`;
    }
  }
  
  return null;
}

// Sleep function for retry delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize tracking on module load
initializeUsageTracking();

export async function getGPT(prompt) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Check usage warning before making request
      const usageWarning = checkUsageWarning();
      
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

      // Initialize Google GenAI with your API key
      const ai = new GoogleGenAI({
        apiKey: 'AIzaSyBx2uKxMSttb8Kn1v2OYGZlkiPZJxfNf88'
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: enhancedPrompt,
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 150,
          stopSequences: []
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      });

      // Increment request count after successful request
      dailyRequestCount++;
      saveUsageTracking();

      // Add usage warning to response if applicable
      let finalResponse = response.text;
      if (usageWarning) {
        finalResponse += `\n\n${usageWarning}`;
      }

      return finalResponse;
      
    } catch (error) {
      lastError = error;
      console.error(`Gemini API attempt ${attempt} failed:`, error);
      
      // Check if it's a retryable error
      const isRetryable = error.message && (
        error.message.includes('503') || 
        error.message.includes('overloaded') ||
        error.message.includes('UNAVAILABLE') ||
        error.message.includes('rate limit') ||
        error.message.includes('quota')
      );
      
      if (isRetryable && attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY}ms... (attempt ${attempt}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY * attempt); // Exponential backoff
        continue;
      }
      
      // If it's not retryable or we've exhausted retries, break
      break;
    }
  }
  
  // All retries failed, return appropriate error message
  console.error('All Gemini API attempts failed:', lastError);
  
  if (lastError.message && lastError.message.includes('503')) {
    return "The AI service is temporarily overloaded. Please try again in a moment.";
  } else if (lastError.message && lastError.message.includes('quota')) {
    return "⚠️ Daily API limit reached. Please try again tomorrow or upgrade your plan.";
  } else if (lastError.message && lastError.message.includes('API key')) {
    return "Please configure your Google API key in the gptapi.js file";
  } else {
    return "The AI service is temporarily unavailable. Please try again later.";
  }
};

// Export function to get current usage stats
export function getUsageStats() {
  return {
    dailyRequestCount,
    dailyLimit: FREE_TIER_DAILY_LIMIT,
    usagePercentage: (dailyRequestCount / FREE_TIER_DAILY_LIMIT) * 100,
    remaining: FREE_TIER_DAILY_LIMIT - dailyRequestCount
  };
}

