// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatMessage } from '@/types/index';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const { messages, endSession, sessionType = 'text', sessionDuration = 0 } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (endSession) {
      return await generateWellnessReport(messages, sessionType, sessionDuration);
    } else {
      return await generateChatResponse(messages, sessionType);
    }

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

async function generateChatResponse(messages: ChatMessage[], sessionType: string) {
  try {
    // Prepare conversation context
    const conversationHistory = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    const systemPrompt = `You are a compassionate AI wellness assistant conducting a ${sessionType} mental health check-in. Your role is to:

1. Create a safe, non-judgmental space for the user to share their feelings
2. Ask thoughtful follow-up questions to understand their mental state
3. Show empathy and validate their experiences
4. Gently explore topics like mood, stress, work satisfaction, energy levels, sleep, and confidence
5. Keep responses conversational and supportive (2-3 sentences max)
6. Avoid giving medical advice - focus on emotional support and active listening
7. ${sessionType === 'voice' ? 'Keep responses concise since this is a voice conversation' : 'You can be slightly more detailed in text conversations'}

Remember: This is a wellness check-in, not therapy. Be warm, understanding, and help them reflect on their current state.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory
      ],
      temperature: 0.7,
      max_tokens: sessionType === 'voice' ? 150 : 300,
    });

    const aiResponse = completion.choices[0]?.message?.content;

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