# Portfolio Website

A modern, responsive portfolio website built with Node.js, Express, and EJS. Features an AI-powered chatbot using Ollama and Google Gemini.

## 🚀 Features

- Responsive design with Bootstrap
- AI Chatbot (Ollama + Gemini fallback)
- Contact form
- Portfolio sections
- Modern UI with animations

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS, Bootstrap, CSS3
- **AI**: Ollama (local), Google Gemini API
- **Database**: MongoDB (optional)

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`

## 🔧 Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
OLLAMA_MODEL=llama2
PORT=8080
NODE_ENV=development
```

## 🚀 Local Development

```bash
# Development mode with auto-reload
npm run server

# Production mode
npm start
```

## 🌐 Deployment to Render.com

### Option 1: Using render.yaml (Recommended)

1. Connect your GitHub repository to Render.com
2. Create a new Web Service
3. Select your repository
4. Render will automatically detect the `render.yaml` configuration
5. Add environment variables in Render dashboard:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `NODE_ENV`: production
   - `OLLAMA_MODEL`: llama2 (optional)

### Option 2: Manual Configuration

1. Create a new Web Service on Render.com
2. Connect your repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables as above

## 🤖 AI Chatbot

The chatbot uses a fallback system:
1. **Ollama** (local AI) - Not available on Render
2. **Google Gemini** - Primary AI service
3. **Offline messages** - Fallback responses

## 📁 Project Structure

```
portfolio/
├── controllers/          # Route controllers
├── model/               # Data models
├── public/              # Static assets (CSS, JS, images)
├── routes/              # API routes
├── views/               # EJS templates
├── .env                 # Environment variables
├── app.js               # Express app setup
├── index.js             # Server entry point
├── package.json         # Dependencies
├── render.yaml          # Render deployment config
└── vercel.json          # Vercel config (legacy)
```

## 📧 Contact

Built by Tarunendra Kumar Tiwari