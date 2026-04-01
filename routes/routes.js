import express from 'express';
import { homeController } from '../controllers/homeController.js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const routes = express.Router();

// Store conversation history per session (in production, use database)
const conversationHistory = {};

let openai = null;
let apiKeyStatus = 'unchecked';
let ollamaStatus = 'unchecked';

// Check Ollama availability
const checkOllama = async () => {
  try {
    const response = await axios.get('http://localhost:11434/api/tags', { timeout: 3000 });
    if (response.status === 200) {
      ollamaStatus = 'available';
      console.log('✅ Ollama is running and available');
      return true;
    }
  } catch (error) {
    ollamaStatus = 'unavailable';
  }
  return false;
};

// Initialize Gemini client
let gemini = null;
if (process.env.GEMINI_API_KEY) {
  if (process.env.GEMINI_API_KEY.includes('your-actual-key') || process.env.GEMINI_API_KEY === 'AIzaSy-your-actual-key') {
    console.warn('⚠️  Gemini API key is not configured. Chatbot will try Ollama or work in offline mode.');
    apiKeyStatus = 'not-configured';
  } else if (process.env.GEMINI_API_KEY.startsWith('AIzaSy')) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      apiKeyStatus = 'configured';
      console.log('✅ Gemini API key loaded successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error.message);
      apiKeyStatus = 'error';
    }
  } else {
    console.warn('⚠️  Invalid Gemini API key format');
    apiKeyStatus = 'invalid';
  }
} else {
  console.warn('⚠️  GEMINI_API_KEY not found in .env file');
  apiKeyStatus = 'not-found';
}

// Check Ollama on startup
await checkOllama();

// Home route
routes.get('/', homeController);

// Contact form route
routes.post('/contact', (req, res) => {
  console.log(req.body);
  res.send("Message received successfully ✅");
});

// API health check
routes.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    apiKey: apiKeyStatus,
    ollama: ollamaStatus,
    message: ollamaStatus === 'available' ? '🦙 Ollama is active!' : (apiKeyStatus === 'configured' ? '🤖 Gemini is ready!' : 'Chatbot is in offline mode')
  });
});

// AI Chatbot route with conversation history - Ollama priority, then Gemini
routes.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Re-check Ollama status on each request (in case it was just started)
    let ollamaAvailable = false;
    try {
      const ollamaCheck = await axios.get('http://localhost:11434/api/tags', { timeout: 1000 });
      if (ollamaCheck.status === 200) {
        ollamaAvailable = true;
        ollamaStatus = 'available';
      }
    } catch (e) {
      ollamaStatus = 'unavailable';
    }

    // Initialize conversation history for this session
    if (!conversationHistory[sessionId]) {
      conversationHistory[sessionId] = [
        {
          role: 'system',
          content: `You are an AI assistant for Tarunendra Kumar Tiwari's portfolio website. You are helpful, friendly, and professional. 
          
About Tarunendra:
- Kristu Jayanti University (KJU) undergraduate student
- Full-stack web developer with expertise in HTML, CSS, JavaScript, Node.js, Express, and MongoDB
- Tech enthusiast passionate about building responsive and user-friendly web applications
- Strong problem-solver with attention to detail and creative thinking
- Committed to continuous learning and staying updated with modern technologies
- Values integrity, dedication, and teamwork in all endeavors

Instructions:
- Keep responses concise (under 80 words) and conversational
- Answer questions about portfolio projects and technical skills
- Discuss web development concepts, technologies, and best practices
- Share insights about learning and personal growth
- If asked about unavailable info, be honest and helpful
- Use a warm, professional tone
- End with a relevant follow-up question when appropriate`
        }
      ];
    }

    // Add user message to history
    conversationHistory[sessionId].push({
      role: 'user',
      content: message
    });

    // Keep only last 10 exchanges to manage token usage
    if (conversationHistory[sessionId].length > 22) {
      conversationHistory[sessionId] = [
        conversationHistory[sessionId][0], // Keep system message
        ...conversationHistory[sessionId].slice(-20) // Keep last 10 exchanges
      ];
    }

    let botMessage = null;
    let source = 'offline';

    // Try Ollama first (free, local)
    if (ollamaStatus === 'available') {
      try {
        const ollamaResponse = await axios.post('http://localhost:11434/api/chat', {
          model: process.env.OLLAMA_MODEL || 'llama2',
          messages: conversationHistory[sessionId].slice(1), // Skip system message for Ollama
          stream: false,
          temperature: 0.7,
        }, {
          timeout: 30000
        });

        if (ollamaResponse.status === 200) {
          botMessage = ollamaResponse.data.message.content.trim();
          source = 'ollama';
          console.log('✅ Response from Ollama');
        }
      } catch (ollamaError) {
        console.warn('⚠️  Ollama request failed:', ollamaError.message);
      }
    }

    // Fallback to Gemini if Ollama failed or unavailable
    if (!botMessage && gemini && apiKeyStatus === 'configured') {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-pro' });

        // Convert conversation history to Gemini format
        const geminiMessages = conversationHistory[sessionId]
          .filter(msg => msg.role !== 'system') // Gemini doesn't have system role
          .map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          }));

        // Add system message as initial user message if it exists
        const systemMessage = conversationHistory[sessionId].find(msg => msg.role === 'system');
        if (systemMessage && geminiMessages.length === 0) {
          geminiMessages.push({
            role: 'user',
            parts: [{ text: systemMessage.content }]
          });
        }

        const chat = model.startChat({
          history: geminiMessages.slice(0, -1), // Exclude the current user message
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.7,
          },
        });

        const result = await chat.sendMessage(geminiMessages[geminiMessages.length - 1].parts[0].text);
        botMessage = result.response.text();
        source = 'gemini';
        console.log('✅ Response from Gemini');
      } catch (geminiError) {
        console.error('❌ Gemini Error:', geminiError.message);
      }
    }

    // Use offline fallback if neither API works
    if (!botMessage) {
      const fallbackResponses = [
        'I\'m just an AI; I don\'t have access to a specific portfolio unless you provide details. I can offer guidance on web development, code structure, and design ideas based on what you tell me.',
        'If you want the previous behavior, send the same prompt you used before and I\'ll provide a consistent response style, using cached context as available.',
        'For offline mode, I can still help with general web concepts: HTML, CSS, JavaScript, Node.js, Express, and deployment workflows.',
      ];
      botMessage = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      source = 'fallback';
    }

    // Add bot response to history
    conversationHistory[sessionId].push({
      role: 'assistant',
      content: botMessage
    });

    res.json({ 
      reply: botMessage,
      sessionId: sessionId,
      offline: source === 'fallback',
      source: source
    });
  } catch (error) {
    console.error('Chat Error:', error.message);
    
    let errorReply = 'Oops! Something went wrong. Try asking about Tarunendra\'s skills or projects!';
    
    if (error.message.includes('401') || error.status === 401) {
      errorReply = 'API key error. Configure OpenAI key in .env file (see CHATBOT_SETUP.md)';
    } else if (error.message.includes('429') || error.status === 429) {
      errorReply = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message.includes('network') || error.code === 'ECONNREFUSED') {
      errorReply = 'Network error. Check your connection and ensure Ollama/OpenAI is accessible.';
    }

    res.status(500).json({ 
      error: error.message,
      reply: errorReply,
      offline: true
    });
  }
});

// Clear conversation history (optional endpoint)
routes.post('/api/chat/clear', (req, res) => {
  const { sessionId } = req.body;
  if (conversationHistory[sessionId]) {
    delete conversationHistory[sessionId];
  }
  res.json({ success: true });
});

export default routes;