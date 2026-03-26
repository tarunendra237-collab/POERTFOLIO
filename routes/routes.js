import express from 'express';
import { homeController } from '../controllers/homeController.js';
import dotenv from 'dotenv';

dotenv.config();

const routes = express.Router();

// Store conversation history per session (in production, use database)
const conversationHistory = {};

let openai = null;
if (process.env.OPENAI_API_KEY) {
  const { OpenAI } = await import('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Home route
routes.get('/', homeController);

// Contact form route
routes.post('/contact', (req, res) => {
  console.log(req.body);
  res.send("Message received successfully ✅");
});

// AI Chatbot route with conversation history
routes.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (!openai) {
      return res.status(500).json({ 
        error: 'AI service not configured',
        reply: 'AI is offline. Please ask about projects, skills, or defence preparation!'
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

Instructions:
- Keep responses concise (under 80 words) and conversational
- Be encouraging about defence preparation goals
- Answer questions about portfolio projects and technical skills
- If asked about unavailable info, be honest
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
      sessionId: sessionId
    });
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    
    let errorReply = 'Oops! Something went wrong. Try asking about my skills or projects!';
    if (error.message.includes('401')) {
      errorReply = 'API key error. Please configure OpenAI key in .env';
    } else if (error.message.includes('429')) {
      errorReply = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message.includes('overloaded')) {
      errorReply = 'OpenAI is busy. Please try again shortly!';
    }

    res.status(500).json({ 
      error: 'Failed to get AI response',
      reply: errorReply
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