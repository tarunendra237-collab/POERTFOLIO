import express from 'express';
import { homeController } from '../controllers/homeController.js';
import dotenv from 'dotenv';

dotenv.config();

const routes = express.Router();

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

// AI Chatbot route
routes.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (!openai) {
      return res.status(500).json({ 
        error: 'AI service not configured. Please add OPENAI_API_KEY to .env file.',
        reply: 'I am currently offline. Please ask me about projects or skills instead!'
      });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for a portfolio website belonging to Tarunendra Kumar Tiwari, an aspiring defence officer and web developer. Keep responses concise (under 100 words), friendly, and relevant to web development, skills, projects, or defence preparation. Answer questions about the portfolio owner.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const botMessage = response.choices[0].message.content;
    res.json({ reply: botMessage });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      reply: 'Hmm, I encountered an error. Try asking about the portfolio owner\'s projects or skills!'
    });
  }
});

export default routes;