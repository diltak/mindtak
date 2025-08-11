'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Globe, Brain } from 'lucide-react';
import { toast } from 'sonner';

export default function TestAIPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const testPerplexity = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/test-perplexity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      
      if (data.success) {
        setResponse(data);
        toast.success('Perplexity API test successful!');
      } else {
        toast.error(data.error || 'Test failed');
        setResponse({ error: data.error });
      }
    } catch (error) {
      toast.error('Network error');
      setResponse({ error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const testOpenAI = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ content: message, sender: 'user' }],
          aiProvider: 'openai',
          deepSearch: false
        }),
      });

      const data = await res.json();
      
      if (data.type === 'message') {
        setResponse({ 
          success: true, 
          response: data.data.content,
          provider: 'OpenAI'
        });
        toast.success('OpenAI test successful!');
      } else {
        toast.error('OpenAI test failed');
        setResponse({ error: 'OpenAI test failed' });
      }
    } catch (error) {
      toast.error('Network error');
      setResponse({ error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Provider Test</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test AI Providers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter your test message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && testPerplexity()}
              />
              <Button onClick={testPerplexity} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Test Perplexity
              </Button>
              <Button onClick={testOpenAI} disabled={loading} variant="outline">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                Test OpenAI
              </Button>
            </div>
          </CardContent>
        </Card>

        {response && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Response</span>
                {response.success && (
                  <Badge variant="secondary">
                    {response.provider || 'Perplexity'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {response.error ? (
                <div className="text-red-600 bg-red-50 p-4 rounded-md">
                  <strong>Error:</strong> {response.error}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-md border">
                    <h4 className="font-medium mb-2">Response:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{response.response}</p>
                  </div>
                  
                  {response.citations && response.citations.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="font-medium mb-2 text-blue-900">Sources:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {response.citations.map((citation: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">[{index + 1}]</span>
                            <span>{citation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {response.model && (
                    <div className="text-xs text-gray-500">
                      Model: {response.model}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
