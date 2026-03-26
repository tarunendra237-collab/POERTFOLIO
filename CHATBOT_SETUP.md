# AI Chatbot Setup Guide

## Quick Start - 3 Steps

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in with your account
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-`)

### Step 2: Add Key to .env File
Open `.env` file in the project root and replace:
```
OPENAI_API_KEY=sk-your-actual-key-here
```

With your actual key:
```
OPENAI_API_KEY=sk-proj-abc123xyz...
```

### Step 3: Start the Server
```bash
npm start
```

Visit http://localhost:8080 and click the 💬 button!

---

## Troubleshooting

### "API key error"
- Make sure `.env` file exists in project root
- Check the key starts with `sk-`
- No spaces around the `=` sign
- Restart the server after updating `.env`

### "Too many requests"
- OpenAI API has rate limits
- Wait a moment and try again
- Upgrade your OpenAI plan if needed

### "Invalid API key"
- Key might be revoked
- Generate a new key from https://platform.openai.com/api-keys
- Check for typos

### "Network error"
- Check your internet connection
- Verify OpenAI is not down (status.openai.com)

---

## Features

✅ Real ChatGPT-like AI assistant
✅ Conversation memory (remembers context)
✅ Custom system prompt (knows about Tarunendra)
✅ Smooth animations
✅ Typing indicator
✅ Mobile responsive

---

## Cost

- Free trial: $5 credit (expires after 3 months)
- Pay as you go: ~$0.0005 per message for GPT-3.5-turbo
- Budget: Set limits in OpenAI dashboard

---

## Testing Without API Key

If you don't have an API key yet, the chatbot will show:
"AI is offline. Please ask about projects, skills, or defence preparation!"

This is the fallback mode that works without any API key.

---

For more help: https://platform.openai.com/docs
