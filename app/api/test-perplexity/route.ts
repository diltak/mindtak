import { NextRequest, NextResponse } from 'next/server';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { error: 'Perplexity API key not configured' },
        { status: 500 }
      );
    }

    // Try a simpler request first
    const requestBody = {
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    };

    console.log('Testing Perplexity API with:', {
      url: PERPLEXITY_API_URL,
      hasApiKey: !!PERPLEXITY_API_KEY,
      apiKeyPrefix: PERPLEXITY_API_KEY?.substring(0, 10) + '...',
      requestBody
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
      
      console.error('Perplexity API Test Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      return NextResponse.json(
        { 
          error: `Perplexity API error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown error'}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            errorData,
            apiKeySet: !!PERPLEXITY_API_KEY
          }
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      response: data.choices[0]?.message?.content,
      citations: data.citations || [],
      model: data.model
    });

  } catch (error: any) {
    console.error('Test Perplexity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}