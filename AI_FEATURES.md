# AI Features Documentation

## Overview
The wellness chat system now supports multiple AI providers with advanced deep search capabilities.

## Supported AI Providers

### 1. OpenAI GPT-4
- **Default provider** for conversational wellness support
- Optimized for empathetic, supportive conversations
- Fast response times
- Excellent for general wellness discussions

### 2. Perplexity AI
- **Web-search enabled** AI for real-time information
- Access to current mental health research and information
- Cites sources from reputable health organizations
- Perfect for evidence-based wellness guidance

## Deep Search Feature

### What is Deep Search?
Deep Search is a powerful feature that enables the AI to access real-time web information to provide:
- Latest mental health research findings
- Current wellness strategies and techniques
- Evidence-based recommendations
- Citations from trusted health sources

### How to Use Deep Search
1. Click the **"AI Settings"** button in the chat interface
2. Select **"Perplexity"** as your AI provider
3. Toggle **"Deep Search"** to ON
4. Ask questions about mental health topics, wellness strategies, or current research

### Example Deep Search Queries
- "What are the latest research findings on workplace stress management?"
- "What are current evidence-based techniques for anxiety reduction?"
- "What do recent studies say about the impact of remote work on mental health?"

## Configuration

### Environment Variables
Add these to your `.env` file:

```env
# OpenAI API Key (required)
OPENAI_API_KEY=your_openai_api_key_here

# Perplexity AI API Key (optional, for deep search)
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

### Getting API Keys

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key

#### Perplexity API Key
1. Visit [Perplexity AI Settings](https://www.perplexity.ai/settings/api)
2. Create an account or sign in
3. Generate a new API key
4. Copy the key to your `.env` file

## Features

### Visual Indicators
- **Green avatar background**: OpenAI responses
- **Blue avatar background**: Perplexity AI responses
- **Provider badges**: Show which AI provider generated each response
- **Deep Search indicator**: Shows when web search is active

### Fallback Mechanism
If Perplexity API is unavailable:
- System automatically falls back to OpenAI
- User is notified about the fallback
- Conversation continues seamlessly

### Voice Mode Support
Both AI providers work with:
- Text-based conversations
- Voice conversations
- Real-time transcription
- Text-to-speech responses

## Best Practices

### When to Use OpenAI
- General wellness conversations
- Emotional support and empathy
- Quick responses needed
- Personal reflection discussions

### When to Use Perplexity with Deep Search
- Research-based questions
- Current mental health trends
- Evidence-based recommendations
- Fact-checking wellness information

## Testing

### Test Page
Visit `/test-ai` to test both AI providers:
- Compare response quality
- Test API connectivity
- Verify deep search functionality
- Check citation accuracy

### API Endpoints
- `/api/chat` - Main chat endpoint with AI provider selection
- `/api/test-perplexity` - Direct Perplexity API testing

## Troubleshooting

### Common Issues
1. **Perplexity API Key Invalid**: Check your API key in `.env` file
2. **Deep Search Not Working**: Ensure Perplexity is selected as provider
3. **Slow Responses**: Deep search takes longer due to web search
4. **Fallback Messages**: Indicates Perplexity API is temporarily unavailable

### Error Handling
- Invalid API keys show user-friendly error messages
- Network errors trigger automatic fallback to OpenAI
- Rate limiting is handled gracefully with retry logic

## Future Enhancements
- Additional AI providers (Claude, Gemini)
- Custom search domain filtering
- Response caching for common queries
- Advanced citation formatting
- Multi-language support