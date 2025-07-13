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

import { 
  Send, 
  Bot, 
  User, 
  PhoneOff, 
  Loader2, 
  FileText, 
  Sparkles, 
  Phone, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Square,
  Play,
  Pause
} from 'lucide-react';
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

// Audio recording utilities
class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;


  async startRecording(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

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
  session_type: 'text' | 'voice';
  session_duration: number;
  key_insights: string[];
  recommendations: string[];
}

export default function EmployeeChatPage() {
  const { user, loading: userLoading } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<WellnessReport | null>(null);

  
  // Voice/Call state
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  const [audioEnabled, setAudioEnabled] = useState(true);



  const [processingAudio, setProcessingAudio] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const audioRecorderRef = useRef<AudioRecorder>(new AudioRecorder());
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

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
















































































































































































































  // Call timer
  useEffect(() => {
    if (isVoiceMode && callStartTime) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.getTime()) / 1000));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
    
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isVoiceMode, callStartTime]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };



  // Text to speech function
  const speakText = (text: string) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    







    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;


    utterance.volume = 1;
    













    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    





















    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };










  // Audio recording controls
  const startRecording = async () => {
    const success = await audioRecorderRef.current.startRecording();
    if (success) {
      setIsRecording(true);
      toast.success('Recording started');
    } else {
      toast.error('Failed to start recording. Please check microphone permissions.');
    }












  };



  const stopRecording = async () => {
    setIsRecording(false);
    setProcessingAudio(true);
    







    const audioBlob = await audioRecorderRef.current.stopRecording();
    
    if (audioBlob) {
      await processAudioMessage(audioBlob);
    } else {
      toast.error('Failed to process audio recording');
    }
    
    setProcessingAudio(false);
  };











  const processAudioMessage = async (audioBlob: Blob) => {
    try {
      // Convert audio to text using Whisper API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const transcriptionResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });






      if (!transcriptionResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }






      const { text } = await transcriptionResponse.json();
      






      if (text.trim()) {
        setCurrentMessage(text);
        await handleSendMessage(text);
      } else {
        toast.error('No speech detected in recording');
      }
    } catch (error) {






      console.error('Error processing audio:', error);
      toast.error('Failed to process audio message');
    }
  };

  // Call controls
  const startCall = () => {
    setIsVoiceMode(true);
    setCallStartTime(new Date());
    setCallDuration(0);
    toast.success('Voice call started - Click microphone to record');
  };

  const endCall = async () => {
    setIsVoiceMode(false);
    setCallStartTime(null);
    setCallDuration(0);

    setIsRecording(false);
    setIsSpeaking(false);
    setProcessingAudio(false);
    
    // Stop any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    












    toast.info('Call ended - generating report...');
    await handleEndSession();
  };

  // Format call duration
  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const initializeChat = async () => {
    if (!user) return;

    try {


      // Create a new chat session
      const sessionRef = collection(db, 'chat_sessions');
      const newSessionDoc = await addDoc(sessionRef, {


        employee_id: user!.id,
        company_id: user!.company_id || 'default',
        session_type: 'text_analysis',
        status: 'active',
        created_at: serverTimestamp(),
        report: null,
      });

      setSessionId(newSessionDoc.id);

      // Add welcome message from AI









      const welcomeMessageContent = `Hello ${user!.first_name || 'there'}! I'm your confidential AI wellness assistant. Let's chat for a few minutes about how you're doing. You can type your responses or use voice mode for a more natural conversation. How have you been feeling lately?`;
      await addMessageToDb(welcomeMessageContent, 'ai', newSessionDoc.id);

      // Set up real-time listener for messages

      const messagesQuery = query(
        collection(db, 'chat_sessions', newSessionDoc.id, 'messages'), 
        orderBy('timestamp')
      );

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



  const handleSendMessage = async (messageText?: string) => {
    const messageContent = messageText || currentMessage;
    if (!messageContent.trim() || !sessionId || loading || sessionEnded) return;



    setCurrentMessage('');

    setLoading(true);






    // Add user message to DB immediately for optimistic UI update

    await addMessageToDb(messageContent, 'user', sessionId);

    try {
      // Note: we fetch the latest messages from state to ensure the API gets the full context
      const messageHistoryForApi = [...messages, { 
        id: 'temp', 
        session_id: sessionId,
        sender: 'user', 
        content: messageContent, 
        timestamp: new Date().toISOString() 
      }];





      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messageHistoryForApi,


          sessionType: isVoiceMode ? 'voice' : 'text'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI.');
      }

      const result = await response.json();

      if (result.type === 'message') {
        await addMessageToDb(result.data.content, 'ai', sessionId);
        // Speak the AI response in voice mode
        if (isVoiceMode && audioEnabled) {
          speakText(result.data.content);
        }
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
        body: JSON.stringify({ 
          messages, 
          endSession: true,
          sessionType: isVoiceMode ? 'voice' : 'text',
          sessionDuration: callDuration || Math.floor((Date.now() - (callStartTime?.getTime() || Date.now())) / 1000)
        }),
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
          session_type: isVoiceMode ? 'voice' : 'text',
          duration: callDuration || Math.floor((Date.now() - (callStartTime?.getTime() || Date.now())) / 1000)
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

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
      </div>
    );
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
                <Badge variant={sessionEnded ? "destructive" : isVoiceMode ? "default" : "secondary"}>
                  {sessionEnded ? 'Session Ended' : isVoiceMode ? `Voice Mode ${formatCallDuration(callDuration)}` : 'Text Mode'}
                </Badge>
                {isVoiceMode && (
                  <div className="flex items-center space-x-2">
                    {isRecording && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                    {isSpeaking && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                    {processingAudio && <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {!sessionEnded && !isVoiceMode && (
                  <Button onClick={startCall} disabled={loading} variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Start Voice Chat
                  </Button>
                )}
                {isVoiceMode && (
                  <>
                    <Button 
                      onClick={() => setAudioEnabled(!audioEnabled)} 
                      variant="outline" 
                      size="sm"
                      title={audioEnabled ? "Disable AI voice" : "Enable AI voice"}
                    >
                      {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                    {isSpeaking && (
                      <Button 
                        onClick={toggleSpeaking} 
                        variant="outline" 
                        size="sm"
                        title="Stop AI speaking"
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      onClick={toggleRecording} 
                      disabled={processingAudio || loading}
                      variant={isRecording ? "destructive" : "outline"} 
                      size="sm"
                      title={isRecording ? "Stop recording" : "Start recording"}
                    >
                      {processingAudio ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isRecording ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                    <Button onClick={endCall} disabled={loading} variant="destructive" size="sm">
                      <PhoneOff className="h-4 w-4 mr-2" />
                      End Voice Chat
                    </Button>
                  </>
                )}
                {!sessionEnded && !isVoiceMode && (
                  <Button onClick={handleEndSession} disabled={loading} variant="secondary" size="sm">
                    {loading && messages.length > 0 ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    End Session & Generate Report
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`rounded-lg px-4 py-2 text-sm ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-800 border'
                  }`}>
                    {message.sender === 'ai' ? (



                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {(loading || processingAudio) && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3 max-w-[85%]">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="flex space-x-1 items-center">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span className="text-xs text-gray-500">
                        {processingAudio ? 'Processing audio...' : 'AI is thinking...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {sessionEnded && generatedReport && (
              <Card className="bg-green-50 border-green-200 p-4">
                <CardHeader className='p-2'>
                  <CardTitle className="text-lg text-green-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Session Complete!
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-2'>
                  <p className="text-green-800 mb-4">
                    Your wellness report has been generated and saved. Here is a summary:
                  </p>
                  <div className="prose prose-sm max-w-none bg-white p-4 rounded-md border">
                    <ReactMarkdown>{generatedReport.complete_report}</ReactMarkdown>
                  </div>
                  
                  {generatedReport.key_insights && generatedReport.key_insights.length > 0 && (
                    <div className="mt-4 bg-blue-50 p-3 rounded-md">
                      <h4 className="font-medium text-blue-900 mb-2">Key Insights:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {generatedReport.key_insights.map((insight, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {generatedReport.recommendations && generatedReport.recommendations.length > 0 && (
                    <div className="mt-4 bg-purple-50 p-3 rounded-md">
                      <h4 className="font-medium text-purple-900 mb-2">Recommendations:</h4>
                      <ul className="text-sm text-purple-800 space-y-1">
                        {generatedReport.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-4 text-xs text-gray-500 flex items-center justify-between">
                    <span>
                      Session Type: {generatedReport.session_type} • 
                      Duration: {Math.floor(generatedReport.session_duration / 60)}m {generatedReport.session_duration % 60}s
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push('/employee/reports')}
                    >
                      View All Reports
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    This report is confidential and intended to help you track your well-being.
                  </p>
                </CardContent>
              </Card>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          <div className="border-t p-4 bg-white">
            {isVoiceMode && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Voice Mode Active</span>
                  <span className="text-sm text-blue-700">{formatCallDuration(callDuration)}</span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  {isRecording && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span>Recording...</span>
                    </div>
                  )}
                  {processingAudio && (
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Processing audio...</span>
                    </div>
                  )}
                  {isSpeaking && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span>AI Speaking...</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-2 text-xs text-gray-600">
                  Click the microphone button to record your message, or type below
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Input
                placeholder={
                  sessionEnded 
                    ? "This session has ended." 
                    : isVoiceMode 
                      ? "Voice input active - or type here..." 
                      : "Type your message..."
                }
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading || sessionEnded || processingAudio}
                className="flex-1"
              />
              <Button 
                onClick={() => handleSendMessage()} 
                disabled={loading || sessionEnded || !currentMessage.trim() || processingAudio}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {!sessionEnded && (
              <p className="text-xs text-gray-500 mt-2">
                {isVoiceMode 
                  ? "Use the microphone button to record voice messages, or type your message. End the voice chat to generate your report."
                  : "Press Enter to send. When you're ready, end the session to get your report."
                }
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}