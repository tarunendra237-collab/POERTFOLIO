import express from 'express';
import { homeController } from '../controllers/homeController.js';
import dotenv from 'dotenv';

dotenv.config();

const routes = express.Router();

// Store conversation history per session (in production, use database)
const conversationHistory = {};

let openai = null;
let apiKeyStatus = 'unchecked';

// Initialize OpenAI client
if (process.env.OPENAI_API_KEY) {
  if (process.env.OPENAI_API_KEY.includes('your-actual-key') || process.env.OPENAI_API_KEY === 'sk-your-actual-key-here') {
    console.warn('⚠️  OpenAI API key is not configured. Chatbot will work in offline mode.');
    apiKeyStatus = 'not-configured';
  } else if (process.env.OPENAI_API_KEY.startsWith('sk-')) {
    try {
      const { OpenAI } = await import('openai');
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      apiKeyStatus = 'configured';
      console.log('✅ OpenAI API key loaded successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI:', error.message);
      apiKeyStatus = 'error';
    }
  } else {
    console.warn('⚠️  Invalid OpenAI API key format');
    apiKeyStatus = 'invalid';
  }
} else {
  console.warn('⚠️  OPENAI_API_KEY not found in .env file');
  apiKeyStatus = 'not-found';
}

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
    message: apiKeyStatus === 'configured' ? 'AI chatbot is ready!' : 'Chatbot is in offline mode'
  });
});

// AI Chatbot route with conversation history
routes.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // If no API key configured, use fallback responses
    if (!openai || apiKeyStatus !== 'configured') {
      const fallbackResponses = [
        'I\'m currently in offline mode. Ask me about Tarunendra\'s projects, skills, or defence preparation!',
        'To enable AI responses, please add your OpenAI API key to the .env file. See CHATBOT_SETUP.md for instructions.',
        'You can still learn about the portfolio! Ask about HTML, CSS, JavaScript, Node.js, or the defence officer preparation journey.',
      ];
      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return res.json({ 
        reply: fallback,
        sessionId: sessionId,
        offline: true
      });
    }

    // Initialize conversation history for this session
    if (!conversationHistory[sessionId]) {
      conversationHistory[sessionId] = [
        {
          role: 'system',
          content: `You are an AI assistant for Tarunendra Kumar Tiwari's portfolio website. You are helpful, friendly, and professional. 
          
About Tarunendra:
- Aspiring Defence Officer preparing for CDS/AFCAT/CAPF exams
- NCC Cadet (Army Wing)
- Web developer skilled in HTML, CSS, JavaScript, Node.js, Express, MongoDB
- Disciplined, goal-oriented individual focused on leadership and physical fitness
- Currently pursuing undergraduate studies at Kristu Jayanti College
- Has built responsive web applications including this portfolio

Instructions:
- Keep responses concise (under 80 words) and conversational
- Be encouraging about defence preparation goals
- Answer questions about portfolio projects and technical skills
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

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: conversationHistory[sessionId],
      max_tokens: 200,
      temperature: 0.7,
    });

    const botMessage = response.choices[0].message.content;

    // Add bot response to history
    conversationHistory[sessionId].push({
      role: 'assistant',
      content: botMessage
    });

    res.json({ 
      reply: botMessage,
      sessionId: sessionId,
      offline: false
    });
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    
    let errorReply = 'Oops! Something went wrong. Try asking about Tarunendra\'s skills or projects!';
    
    if (error.message.includes('401') || error.status === 401) {
      errorReply = 'API key error. Please configure a valid OpenAI key in .env file (see CHATBOT_SETUP.md)';
    } else if (error.message.includes('429') || error.status === 429) {
      errorReply = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message.includes('overloaded') || error.status === 503) {
      errorReply = 'OpenAI service is busy. Please try again shortly!';
    } else if (error.message.includes('network') || error.code === 'ECONNREFUSED') {
      errorReply = 'Network error. Check your internet connection.';
    }

    res.status(500).json({ 
      error: error.message,
      reply: errorReply,
      offline: false
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