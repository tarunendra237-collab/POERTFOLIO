import express from 'express';
import { homeController } from '../controllers/homeController.js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const routes = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Home route
routes.get('/', homeController);

// Contact form route
routes.post('/contact', (req, res) => {
  console.log(req.body); // see data in terminal
  res.send("Message received successfully ✅");
});

// AI Chatbot route
routes.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for a portfolio website. Keep responses concise and relevant to web development, skills, and projects.'
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
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

export default routes;