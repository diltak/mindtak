// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatMessage } from '@/types/index';
import { getRecentReports, generateReportsAnalytics, formatReportsForAI, getPersonalHistory, formatPersonalHistoryForAI } from '@/lib/reports-service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Perplexity AI configuration
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

interface WellnessReport {
  mood: number;
  stress_score: number;
  anxious_level: number;
  work_satisfaction: number;
  work_life_balance: number;
  energy_level: number;
  confident_level: number;
  sleep_quality: number;
  complete_report: string;
  session_type: 'text' | 'voice';
  session_duration: number;
  key_insights: string[];
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    const {
      messages,
      endSession,
      sessionType = 'text',
      sessionDuration = 0,
      userId,
      companyId,
      deepSearch = false,
      aiProvider = 'openai' // 'openai' or 'perplexity'
    } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (endSession) {
      return await generateWellnessReport(messages, sessionType, sessionDuration);
    } else {
      return await generateChatResponse(messages, sessionType, userId, companyId, deepSearch, aiProvider);
    }

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Perplexity AI API call function
async function callPerplexityAPI(messages: any[], systemPrompt: string, maxTokens: number = 300) {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not configured');
  }

  // Format messages properly for Perplexity API
  // Ensure alternating user/assistant pattern after system message
  const formattedMessages = [{ role: 'system', content: systemPrompt }];

  // Add conversation history, ensuring proper alternation
  // Perplexity requires strict alternating pattern: user -> assistant -> user -> assistant
  let lastRole = 'system';

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const currentRole = message.role;

    // If we have consecutive messages from the same role, we need to handle it
    if (currentRole === lastRole && lastRole !== 'system') {
      // Skip consecutive messages from the same role, or merge them
      if (formattedMessages.length > 1) {
        // Merge with the previous message of the same role
        const lastMessage = formattedMessages[formattedMessages.length - 1];
        lastMessage.content += '\n' + message.content;
        continue;
      }
    }

    // Ensure we start with a user message after system
    if (formattedMessages.length === 1 && currentRole !== 'user') {
      // If the first message after system is not from user, skip or convert it
      if (currentRole === 'assistant') {
        continue; // Skip assistant messages at the beginning
      }
    }

    formattedMessages.push({
      role: currentRole,
      content: message.content
    });

    lastRole = currentRole;
  }

  // Ensure we end with a user message for Perplexity to respond to
  if (formattedMessages.length > 1 && formattedMessages[formattedMessages.length - 1].role !== 'user') {
    // If the last message is not from user, we might need to add a prompt
    // But in most cases, this should not happen in a chat flow
  }

  const requestBody = {
    model: 'sonar',
    messages: formattedMessages,
    max_tokens: maxTokens,
    temperature: 0.7,
    top_p: 0.9,
    search_domain_filter: ["pubmed.ncbi.nlm.nih.gov", "who.int", "mayoclinic.org", "webmd.com", "healthline.com"],
    return_citations: true,
    search_recency_filter: "month",
    top_k: 0,
    stream: false,
    presence_penalty: 0,
    frequency_penalty: 1
  };

  console.log('Perplexity API Request:', {
    url: PERPLEXITY_API_URL,
    hasApiKey: !!PERPLEXITY_API_KEY,
    apiKeyPrefix: PERPLEXITY_API_KEY?.substring(0, 10) + '...',
    model: requestBody.model,
    messageCount: formattedMessages.length,
    messageRoles: formattedMessages.map(m => m.role)
  });

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }

    console.error('Perplexity API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
      headers: Object.fromEntries(response.headers.entries())
    });

    throw new Error(`Perplexity API error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown error'}`);
  }

  const result = await response.json();
  console.log('Perplexity API Success:', {
    hasChoices: !!result.choices,
    choicesLength: result.choices?.length,
    hasCitations: !!result.citations,
    citationsLength: result.citations?.length
  });

  return result;
}

async function generateChatResponse(messages: ChatMessage[], sessionType: string, userId?: string, companyId?: string, deepSearch: boolean = false, aiProvider: string = 'openai') {
  try {
    // Get company-wide reports context
    let reportsContext = '';
    if (companyId) {
      try {
        const recentReports = await getRecentReports(companyId, 7);
        const analytics = generateReportsAnalytics(recentReports);
        reportsContext = formatReportsForAI(recentReports, analytics);
      } catch (error) {
        console.error('Error fetching reports context:', error);
        // Continue without reports context if there's an error
      }
    }

    // Get personal history context
    let personalContext = '';
    if (userId && companyId) {
      try {
        const personalHistory = await getPersonalHistory(userId, companyId, 30);
        personalContext = formatPersonalHistoryForAI(personalHistory);
      } catch (error) {
        console.error('Error fetching personal history:', error);
        // Continue without personal context if there's an error
      }
    }

    // Prepare conversation context
    const conversationHistory = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));



    let systemPrompt = `You are a compassionate AI wellness assistant conducting a ${sessionType} mental health check-in. Your role is to:

1. Create a safe, non-judgmental space for the user to share their feelings
2. Ask thoughtful follow-up questions to understand their mental state
3. Show empathy and validate their experiences
4. Gently explore topics like mood, stress, work satisfaction, energy levels, sleep, and confidence
5. Keep responses conversational and supportive (2-3 sentences max)
6. Avoid giving medical advice - focus on emotional support and active listening
7. ${sessionType === 'voice' ? 'Keep responses concise since this is a voice conversation' : 'You can be slightly more detailed in text conversations'}

${personalContext ? `
PERSONAL HISTORY CONTEXT:
You have access to this user's previous wellness sessions and reports. Use this to provide continuity and personalized support:

${personalContext}

Use this personal history to:
- Reference previous conversations naturally ("Last time we talked about...")
- Track progress and acknowledge improvements or concerns
- Build on previous insights and recommendations
- Provide personalized follow-up questions
- Celebrate progress or offer additional support for ongoing challenges
- Remember recurring themes and patterns in their wellness journey
` : ''}

${reportsContext ? `
COMPANY WELLNESS CONTEXT:
You also have access to recent wellness data from the user's company. Use this context to provide more personalized support and identify patterns, but NEVER reveal specific details about other employees. You can reference general trends like "I notice stress levels have been higher across the company lately" or "Many team members have been reporting similar challenges."

${reportsContext}

Use this information to:
- Provide context-aware support
- Identify if the user's experience aligns with company trends
- Offer relevant insights without breaching privacy
- Suggest company-wide wellness initiatives when appropriate
` : ''}

Remember: This is a wellness check-in, not therapy. Be warm, understanding, and help them reflect on their current state. Use both personal and company context to provide the most supportive and relevant conversation possible.`;

    // Add deep search context for Perplexity
    if (deepSearch && aiProvider === 'perplexity') {
      systemPrompt += `

DEEP SEARCH MODE: You have access to real-time web search capabilities. When the user asks questions about mental health topics, wellness strategies, or current research, use your web search to provide up-to-date, evidence-based information. Always cite your sources and focus on reputable health organizations and recent research.`;
    }

    let aiResponse: string | undefined;

    if (aiProvider === 'perplexity' && deepSearch) {
      try {
        // Use Perplexity for deep search capabilities
        const perplexityResponse = await callPerplexityAPI(
          conversationHistory,
          systemPrompt,
          sessionType === 'voice' ? 150 : 300
        );
        aiResponse = perplexityResponse.choices[0]?.message?.content || undefined;
      } catch (perplexityError) {
        console.error('Perplexity API failed, falling back to OpenAI:', perplexityError);
        // Fallback to OpenAI if Perplexity fails
        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt + '\n\nNote: Deep search is temporarily unavailable, providing response based on training data.' },
            ...conversationHistory
          ],
          temperature: 0.7,
          max_tokens: sessionType === 'voice' ? 150 : 300,
        });
        const fallbackResponse = completion.choices[0]?.message?.content;
        aiResponse = fallbackResponse ? fallbackResponse + '\n\n*Note: Deep search temporarily unavailable - response based on existing knowledge.*' : undefined;
      }
    } else {
      // Use OpenAI (default)
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: sessionType === 'voice' ? 150 : 300,
      });
      const openaiResponse = completion.choices[0]?.message?.content;
      aiResponse = openaiResponse ?? undefined;
    }

    if (!aiResponse) {
      throw new Error('No response generated from AI');
    }

    return NextResponse.json({
      type: 'message',
      data: {
        content: aiResponse,
        sender: 'ai'
      }
    });

  } catch (error: any) {
    console.error('Error generating chat response:', error);
    throw error;
  }
}

async function generateWellnessReport(messages: ChatMessage[], sessionType: string, sessionDuration: number): Promise<NextResponse> {
  try {
    // Extract user messages for analysis
    const userMessages = messages
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.content)
      .join('\n');

    const analysisPrompt = `Analyze this ${sessionType} wellness conversation and generate a comprehensive mental health report. The conversation lasted ${Math.floor(sessionDuration / 60)} minutes and ${sessionDuration % 60} seconds.

User's responses:
${userMessages}

Generate a JSON report with the following structure:
{
  "mood": [1-10 scale],
  "stress_score": [1-10 scale, where 10 is highest stress],
  "anxious_level": [1-10 scale],
  "work_satisfaction": [1-10 scale],
  "work_life_balance": [1-10 scale],
  "energy_level": [1-10 scale],
  "confident_level": [1-10 scale],
  "sleep_quality": [1-10 scale],
  "complete_report": "A comprehensive 2-3 paragraph analysis of the user's mental state, key concerns, and overall wellness",
  "session_type": "${sessionType}",
  "session_duration": ${sessionDuration},
  "key_insights": ["3-5 key insights about the user's mental state"],
  "recommendations": ["3-5 specific, actionable recommendations for improving wellness"]
}

Guidelines:
- Base scores on actual conversation content
- If information is missing, use reasonable estimates based on available data
- Be empathetic and constructive in the complete_report
- Make recommendations specific and actionable
- Consider the ${sessionType} format in your analysis
- Focus on patterns and themes in their responses`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a mental health analysis AI. Provide accurate, empathetic assessments based on conversation data. Always respond with valid JSON.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No analysis generated from AI');
    }

    // Parse the JSON response
    let report: WellnessReport;
    try {
      report = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiResponse);
      // Fallback report if JSON parsing fails
      report = {
        mood: 5,
        stress_score: 5,
        anxious_level: 5,
        work_satisfaction: 5,
        work_life_balance: 5,
        energy_level: 5,
        confident_level: 5,
        sleep_quality: 5,
        complete_report: "Unable to generate detailed analysis due to processing error. Please try again or contact support.",
        session_type: sessionType as 'text' | 'voice',
        session_duration: sessionDuration,
        key_insights: ["Analysis temporarily unavailable"],
        recommendations: ["Please try another session for detailed recommendations"]
      };
    }

    return NextResponse.json({
      type: 'report',
      data: report
    });

  } catch (error: any) {
    console.error('Error generating wellness report:', error);
    throw error;
  }
}