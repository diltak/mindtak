// app/api/chat/route.ts

import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import type { ChatMessage } from '@/types/index';

export const dynamic = 'force-dynamic';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The brain of our AI wellness coach
const systemPrompt = `
You are an empathetic and professional AI wellness coach. Your primary goal is to conduct a brief, friendly, and supportive chat session with an employee to assess their current mental well-being.

Your conversation should naturally touch upon the following key areas:
1.  **Mood:** How they are feeling overall.
2.  **Stress:** Current stress levels, and what might be causing them.
3.  **Anxiety:** Any feelings of anxiety or worry.
4.  **Work Satisfaction:** How they feel about their current work.
5.  **Work-Life Balance:** How they are managing the boundary between work and personal life.
6.  **Energy Levels:** Their physical and mental energy.
7.  **Confidence:** Their self-esteem and confidence levels.
8.  **Sleep Quality:** How well they have been sleeping.

Keep your responses conversational, supportive, and not too clinical. Ask one or two questions at a time.

**IMPORTANT:**
When the user indicates the session is ending, or when the 'endSession' flag is true, you MUST stop the conversation and respond ONLY with a valid JSON object. Do not include any other text, greetings, or explanations outside of the JSON. The JSON object must have the following structure and contain your analysis of the entire conversation, with scores from 1 (very poor) to 10 (excellent):

{
  "mood": <number 1-10>,
  "stress_score": <number 1-10>,
  "anxious_level": <number 1-10>,
  "work_satisfaction": <number 1-10>,
  "work_life_balance": <number 1-10>,
  "energy_level": <number 1-10>,
  "confident_level": <number 1-10>,
  "sleep_quality": <number 1-10>,
  "complete_report": "<A concise, empathetic markdown-formatted summary of the conversation, highlighting key points, potential areas of concern, and positive aspects. This should be a few paragraphs long.>"
}
`;

export async function POST(req: Request) {
    try {
      const { messages, endSession } = (await req.json()) as {
        messages: ChatMessage[];
        endSession?: boolean;
      };

      if (!messages) {
        return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
      }

      // Map our ChatMessage format to the OpenAI format
      const openAiMessages = messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content,
      }));

      // If endSession is flagged, add a final instruction to generate the report
      if (endSession) {
          openAiMessages.push({
              role: 'user' as const,
              content: 'The session is now over. Please provide the final JSON report based on our conversation.'
          });
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4', // or 'gpt-3.5-turbo' for faster, cheaper responses
        messages: [
          {
            role: 'system' as const,
            content: systemPrompt,
          },
          ...openAiMessages,
        ],
        temperature: 0.7,
      });

      const aiResponseContent = response.choices[0].message?.content;

      if (!aiResponseContent) {
          return NextResponse.json({ error: 'Failed to get response from AI' }, { status: 500 });
      }

      // Check if the response is the JSON report
      if (aiResponseContent.trim().startsWith('{')) {
          try {
              const report = JSON.parse(aiResponseContent);
              // It's a report
              return NextResponse.json({ type: 'report', data: report });
          } catch (error) {
              // It looked like JSON but wasn't valid, treat as a normal message
               return NextResponse.json({ type: 'message', data: { content: aiResponseContent } });
          }
      } else {
          // It's a regular message
          return NextResponse.json({ type: 'message', data: { content: aiResponseContent } });
      }

    } catch (error) {
      console.error('[CHAT_API_ERROR]', error);
      return new NextResponse('Internal Error', { status: 500 });
    }
}