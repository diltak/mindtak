// --- START OF FILE page.tsx ---

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, PhoneOff, Loader2, FileText, Sparkles } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { toast } from 'sonner';
import type { ChatMessage } from '@/types/index';
import ReactMarkdown from 'react-markdown';


import {
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// The final report structure
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
}

export default function EmployeeChatPage() {
  const { user, loading: userLoading } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<WellnessReport | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/signin');
      return;
    }
    if (user) {
      initializeChat();
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    if (!user) return;

    try {
      // Create a new chat session
      const sessionRef = collection(db, 'chat_sessions');
      const newSessionDoc = await addDoc(sessionRef, {
        employee_id: user!.id,
        session_type: 'text_analysis',
        status: 'active',
        created_at: serverTimestamp(),
        report: null,
      });

      setSessionId(newSessionDoc.id);

      // Add welcome message from AI
      const welcomeMessageContent = `Hello ${user!.first_name || 'there'}! I'm your confidential AI wellness assistant. Let's chat for a few minutes about how you're doing. How have you been feeling lately?`;
      await addMessageToDb(welcomeMessageContent, 'ai', newSessionDoc.id);

      // Set up real-time listener for messages
      const messagesQuery = query(collection(db, 'chat_sessions', newSessionDoc.id, 'messages'), orderBy('timestamp'));
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData: ChatMessage[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<ChatMessage, 'id'>,
          timestamp: doc.data().timestamp?.toDate().toISOString() || new Date().toISOString(),
        }));
        setMessages(messagesData);
      });

      return () => unsubscribe();
    } catch (error: any) {
      console.error('Error creating chat session:', error);
      toast.error('Failed to initialize chat session.');
    }
  };

  const addMessageToDb = async (content: string, sender: 'user' | 'ai', currentSessionId: string) => {
    if (!currentSessionId) return;
    try {
      const messagesRef = collection(db, 'chat_sessions', currentSessionId, 'messages');
      await addDoc(messagesRef, {
        content,
        sender,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding message to DB:', error);
      toast.error('Could not save message.');
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !sessionId || loading || sessionEnded) return;

    const userMessageContent = currentMessage;
    setCurrentMessage('');
    setLoading(true);

    // Add user message to DB immediately for optimistic UI update
    await addMessageToDb(userMessageContent, 'user', sessionId);

    try {
        // Note: we fetch the latest messages from state to ensure the API gets the full context
        const messageHistoryForApi = [...messages, { id: 'temp', sender: 'user', content: userMessageContent, timestamp: new Date().toISOString() }];

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: messageHistoryForApi }),
        });

        if (!response.ok) {
            throw new Error('Failed to get response from AI.');
        }

        const result = await response.json();

        if (result.type === 'message') {
            await addMessageToDb(result.data.content, 'ai', sessionId);
        } else {
            // This case should not happen during a normal conversation
            console.warn('Received a report unexpectedly. Treating as a message.');
            await addMessageToDb(JSON.stringify(result.data), 'ai', sessionId);
        }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('An error occurred while communicating with the AI.');
      // Optionally add the error message back to the chat for the user
      await addMessageToDb('Sorry, I encountered an error. Please try again.', 'ai', sessionId);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!sessionId || loading || sessionEnded) return;

    toast.info('Generating your wellness report...');
    setLoading(true);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, endSession: true }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate report from AI.');
        }

        const result = await response.json();

        if (result.type === 'report') {
            const report = result.data as WellnessReport;
            const sessionDocRef = doc(db, 'chat_sessions', sessionId);
            await updateDoc(sessionDocRef, {
                report: report,
                status: 'completed',
                completed_at: serverTimestamp(),
            });
            setGeneratedReport(report);
            setSessionEnded(true);
            toast.success('Wellness report generated successfully!');
        } else {
            throw new Error('AI did not return a valid report format.');
        }

    } catch (error) {
        console.error('Error ending session and generating report:', error);
        toast.error('Could not generate your report. Please try again later.');
    } finally {
        setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (userLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-blue-600" /></div>;
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">AI Wellness Assistant</h1>
          <p className="text-gray-600 mt-1">Your confidential space to reflect on your well-being.</p>
        </div>

        <Card className="h-[70vh] flex flex-col shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <span>Wellness Chat</span>
                <Badge variant={sessionEnded ? "destructive" : "default"}>
                  {sessionEnded ? 'Session Ended' : 'Active'}
                </Badge>
              </div>
              {!sessionEnded && (
                <Button onClick={handleEndSession} disabled={loading} variant="secondary" size="sm">
                  {loading && messages.length > 0 ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                  End Session & Generate Report
                </Button>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</AvatarFallback>
                  </Avatar>
                  <div className={`rounded-lg px-4 py-2 text-sm ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border'}`}>
                    <p>{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && messages.length > 0 && (
              <div className="flex justify-start">
                 <div className="flex items-start space-x-3 max-w-[85%]">
                    <Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
                    <div className="bg-white rounded-lg p-3 border">
                        <div className="flex space-x-1 items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-gray-500">AI is typing...</span>
                        </div>
                    </div>
                </div>
              </div>
            )}
            
            {sessionEnded && generatedReport && (
                <Card className="bg-green-50 border-green-200 p-4">
                    <CardHeader className='p-2'>
                        <CardTitle className="text-lg text-green-900">Session Complete!</CardTitle>
                    </CardHeader>
                    <CardContent className='p-2'>
                        <p className="text-green-800 mb-4">Your wellness report has been generated and saved. Here is a summary:</p>
                        <div className="prose prose-sm max-w-none bg-white p-4 rounded-md border">
                            <ReactMarkdown>{generatedReport.complete_report}</ReactMarkdown>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">This report is confidential and intended to help you track your well-being. You can access full reports from your dashboard in the future.</p>
                    </CardContent>
                </Card>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          <div className="border-t p-4 bg-white">
            <div className="flex space-x-2">
              <Input
                placeholder={sessionEnded ? "This session has ended." : "Type your message..."}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading || sessionEnded}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={loading || sessionEnded || !currentMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!sessionEnded && <p className="text-xs text-gray-500 mt-2">Press Enter to send. When you're ready, end the session to get your report.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}