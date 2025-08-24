// --- START OF FILE page.tsx ---

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
  Pause,
  Search,
  Menu,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import type { ChatMessage } from "@/types/index";
import ReactMarkdown from "react-markdown";
import { DeepConversationToggle } from "@/components/shared/ai-provider-selector";

import {
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
          sampleRate: 16000,
        },
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: "audio/webm;codecs=opus",
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
      console.error("Error starting recording:", error);
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
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
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
  session_type: "text" | "voice";
  session_duration: number;
  key_insights: string[];
  recommendations: string[];
}

// Helper function to calculate risk level based on report data
const calculateRiskLevel = (
  report: WellnessReport
): "low" | "medium" | "high" => {
  const riskFactors = [
    report.stress_score >= 8 ? 2 : report.stress_score >= 6 ? 1 : 0,
    report.anxious_level >= 8 ? 2 : report.anxious_level >= 6 ? 1 : 0,
    report.mood <= 3 ? 2 : report.mood <= 5 ? 1 : 0,
    report.energy_level <= 3 ? 1 : 0,
    report.work_satisfaction <= 3 ? 1 : 0,
    report.sleep_quality <= 3 ? 1 : 0,
    report.confident_level <= 3 ? 1 : 0,
  ];

  const totalRisk = riskFactors.reduce((sum, factor) => sum + factor, 0);

  if (totalRisk >= 6) return "high";
  if (totalRisk >= 3) return "medium";
  return "low";
};

export default function EmployeeChatPage() {
  const { user, loading: userLoading } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<WellnessReport | null>(
    null
  );

  // Voice/Call state
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  const [audioEnabled, setAudioEnabled] = useState(true);

  // Deep Conversation state
  const [deepConversation, setDeepConversation] = useState(true);

  const [processingAudio, setProcessingAudio] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const audioRecorderRef = useRef<AudioRecorder>(new AudioRecorder());
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Allow demo access without authentication
    if (!userLoading) {
      if (!user) {
        // Demo mode - continue without user
        console.log("Demo mode: No authentication required");
      }
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
        setCallDuration(
          Math.floor((Date.now() - callStartTime.getTime()) / 1000)
        );
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Text to speech function
  const speakText = (text: string) => {
    if (!audioEnabled || !("speechSynthesis" in window)) return;

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
      toast.success("Recording started");
    } else {
      toast.error(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setProcessingAudio(true);
    const audioBlob = await audioRecorderRef.current.stopRecording();

    if (audioBlob) {
      await processAudioMessage(audioBlob);
    } else {
      toast.error("Failed to process audio recording");
    }

    setProcessingAudio(false);
  };

  const processAudioMessage = async (audioBlob: Blob) => {
    try {
      // Convert audio to text using Whisper API
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const transcriptionResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      if (!transcriptionResponse.ok) {
        throw new Error("Failed to transcribe audio");
      }
      const { text } = await transcriptionResponse.json();
      if (text.trim()) {
        setCurrentMessage(text);
        await handleSendMessage(text);
      } else {
        toast.error("No speech detected in recording");
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Failed to process audio message");
    }
  };

  // Call controls
  const startCall = () => {
    setIsVoiceMode(true);
    setCallStartTime(new Date());
    setCallDuration(0);
    toast.success("Voice call started - Click microphone to record");
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
    toast.info("Call ended - generating report...");
    await handleEndSession();
  };

  // Format call duration
  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const initializeChat = async () => {
    if (!user) return;

    try {
      // Create a new chat session
      const sessionRef = collection(db, "chat_sessions");
      const newSessionDoc = await addDoc(sessionRef, {
        employee_id: user!.id,
        company_id: user!.company_id || "default",
        session_type: "text_analysis",
        status: "active",
        created_at: serverTimestamp(),
        report: null,
      });

      setSessionId(newSessionDoc.id);

      // Add welcome message from AI
      const welcomeMessageContent = `Hello ${
        user!.first_name || "there"
      }! I'm your confidential AI wellness assistant. Let's chat for a few minutes about how you're doing. 

You can:
• Type your responses or use voice mode for natural conversation
• Enable "Deep Conversation" for real-time mental health research and information

How have you been feeling lately?`;
      await addMessageToDb(welcomeMessageContent, "ai", newSessionDoc.id);

      // Set up real-time listener for messages

      const messagesQuery = query(
        collection(db, "chat_sessions", newSessionDoc.id, "messages"),
        orderBy("timestamp")
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData: ChatMessage[] = snapshot.docs.map((doc) => ({
          id: doc.id,

          ...(doc.data() as Omit<ChatMessage, "id">),
          timestamp:
            doc.data().timestamp?.toDate().toISOString() ||
            new Date().toISOString(),
        }));
        setMessages(messagesData);
      });

      return () => unsubscribe();
    } catch (error: any) {
      console.error("Error creating chat session:", error);
      toast.error("Failed to initialize chat session.");
    }
  };

  const addMessageToDb = async (
    content: string,
    sender: "user" | "ai",
    currentSessionId: string
  ) => {
    if (!currentSessionId) return;
    try {
      const messagesRef = collection(
        db,
        "chat_sessions",
        currentSessionId,
        "messages"
      );
      await addDoc(messagesRef, {
        content,
        sender,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding message to DB:", error);
      toast.error("Could not save message.");
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const messageContent = messageText || currentMessage;
    if (!messageContent.trim() || !sessionId || loading || sessionEnded) return;

    setCurrentMessage("");

    setLoading(true);

    // Add user message to DB immediately for optimistic UI update

    await addMessageToDb(messageContent, "user", sessionId);

    try {
      // Note: we fetch the latest messages from state to ensure the API gets the full context
      const messageHistoryForApi = [
        ...messages,
        {
          id: "temp",
          session_id: sessionId,
          sender: "user",
          content: messageContent,
          timestamp: new Date().toISOString(),
        },
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messageHistoryForApi,
          sessionType: isVoiceMode ? "voice" : "text",
          userId: user?.id,
          companyId: user?.company_id,
          deepSearch: deepConversation,
          aiProvider: deepConversation ? "perplexity" : "openai",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI.");
      }

      const result = await response.json();

      if (result.type === "message") {
        await addMessageToDb(result.data.content, "ai", sessionId);
        // Speak the AI response in voice mode
        if (isVoiceMode && audioEnabled) {
          speakText(result.data.content);
        }
      } else {
        // This case should not happen during a normal conversation
        console.warn("Received a report unexpectedly. Treating as a message.");
        await addMessageToDb(JSON.stringify(result.data), "ai", sessionId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("An error occurred while communicating with the AI.");
      // Optionally add the error message back to the chat for the user
      await addMessageToDb(
        "Sorry, I encountered an error. Please try again.",
        "ai",
        sessionId
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!sessionId || loading || sessionEnded || !user) return;

    toast.info("Generating your wellness report...");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          endSession: true,
          sessionType: isVoiceMode ? "voice" : "text",
          sessionDuration:
            callDuration ||
            Math.floor(
              (Date.now() - (callStartTime?.getTime() || Date.now())) / 1000
            ),
          userId: user?.id,
          companyId: user?.company_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report from AI.");
      }

      const result = await response.json();

      if (result.type === "report") {
        const report = result.data as WellnessReport;
        const sessionDuration =
          callDuration ||
          Math.floor(
            (Date.now() - (callStartTime?.getTime() || Date.now())) / 1000
          );

        // Update the chat session
        const sessionDocRef = doc(db, "chat_sessions", sessionId);
        await updateDoc(sessionDocRef, {
          report: report,
          status: "completed",
          completed_at: serverTimestamp(),
          session_type: isVoiceMode ? "voice" : "text",
          duration: sessionDuration,
        });

        // Save the report to the mental_health_reports collection
        const mentalHealthReport = {
          employee_id: user.id,
          company_id: user.company_id || "default",
          stress_level: Math.max(
            1,
            Math.min(10, Math.round(report.stress_score))
          ),
          mood_rating: Math.max(1, Math.min(10, Math.round(report.mood))),
          energy_level: Math.max(
            1,
            Math.min(10, Math.round(report.energy_level))
          ),
          work_satisfaction: Math.max(
            1,
            Math.min(10, Math.round(report.work_satisfaction))
          ),
          work_life_balance: Math.max(
            1,
            Math.min(10, Math.round(report.work_life_balance))
          ),
          anxiety_level: Math.max(
            1,
            Math.min(10, Math.round(report.anxious_level))
          ),
          confidence_level: Math.max(
            1,
            Math.min(10, Math.round(report.confident_level))
          ),
          sleep_quality: Math.max(
            1,
            Math.min(10, Math.round(report.sleep_quality))
          ),
          overall_wellness: Math.max(
            1,
            Math.min(
              10,
              Math.round(
                (report.mood +
                  report.energy_level +
                  report.work_satisfaction +
                  report.work_life_balance +
                  report.confident_level +
                  report.sleep_quality +
                  (11 - report.stress_score) +
                  (11 - report.anxious_level)) /
                  8
              )
            )
          ),
          comments: `AI-generated report from ${
            isVoiceMode ? "voice" : "text"
          } session`,
          ai_analysis:
            report.complete_report || "Report generated successfully",
          sentiment_score: Math.max(0, Math.min(1, report.mood / 10)),
          emotion_tags: Array.isArray(report.key_insights)
            ? report.key_insights
            : [],
          risk_level: calculateRiskLevel(report),
          session_type: isVoiceMode ? "voice" : "text",
          session_duration: sessionDuration,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          await addDoc(
            collection(db, "mental_health_reports"),
            mentalHealthReport
          );
          console.log("Mental health report saved successfully");
        } catch (saveError) {
          console.error("Error saving mental health report:", saveError);
          // Don't throw here - we still want to show the report to the user
          toast.error(
            "Report generated but failed to save. Please contact support."
          );
        }

        setGeneratedReport(report);
        setSessionEnded(true);
        toast.success("Wellness report generated and saved successfully!");
      } else {
        throw new Error("AI did not return a valid report format.");
      }
    } catch (error) {
      console.error("Error ending session and generating report:", error);
      toast.error("Could not generate your report. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
    <div className="min-h-screen bg-gray-50 ">
      <Navbar user={user} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Wellness Assistant
          </h1>
          <p className="text-gray-600 mt-1">
            Your confidential space to reflect on your well-being.
          </p>
        </div>
          <Card className="flex flex-col item-center justify-center shadow-lg w-auto">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                  <span>Wellness Chat</span>
                  <Badge
                    variant={
                      sessionEnded
                        ? "destructive"
                        : isVoiceMode
                        ? "default"
                        : "secondary"
                    }
                  >
                    {sessionEnded
                      ? "Session Ended"
                      : isVoiceMode
                      ? `Voice Mode ${formatCallDuration(callDuration)}`
                      : "Text Mode"}
                  </Badge>
                  {isVoiceMode && (
                    <div className="flex items-center space-x-2">
                      {isRecording && (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                      {isSpeaking && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                      {processingAudio && (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  )}
                </div>

                {/* Desktop Buttons */}
                <div className="hidden sm:flex items-center space-x-2">
                  {!sessionEnded && !isVoiceMode && (
                    <Button
                      onClick={startCall}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                    >
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
                        title={
                          audioEnabled ? "Disable AI voice" : "Enable AI voice"
                        }
                      >
                        {audioEnabled ? (
                          <Volume2 className="h-4 w-4" />
                        ) : (
                          <VolumeX className="h-4 w-4" />
                        )}
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
                        title={
                          isRecording ? "Stop recording" : "Start recording"
                        }
                      >
                        {processingAudio ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isRecording ? (
                          <Square className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        onClick={endCall}
                        disabled={loading}
                        variant="destructive"
                        size="sm"
                      >
                        <PhoneOff className="h-4 w-4 mr-2" />
                        End Voice Chat
                      </Button>
                    </>
                  )}
                  {!sessionEnded && !isVoiceMode && (
                    <Button
                      onClick={handleEndSession}
                      disabled={loading}
                      variant="secondary"
                      size="sm"
                    >
                      {loading && messages.length > 0 ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      End Session & Generate Report
                    </Button>
                  )}
                </div>

                {/* Mobile Hamburger */}
                <div className="sm:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-64">
                      <SheetHeader>
                        <SheetTitle>Actions</SheetTitle>
                        <SheetDescription>
                          Manage your wellness chat session
                        </SheetDescription>
                      </SheetHeader>

                      <div className="mt-4 flex flex-col space-y-3">
                        {!sessionEnded && !isVoiceMode && (
                          <Button
                            onClick={startCall}
                            disabled={loading}
                            variant="outline"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Start Voice Chat
                          </Button>
                        )}

                        {isVoiceMode && (
                          <>
                            <Button
                              onClick={() => setAudioEnabled(!audioEnabled)}
                              variant="outline"
                            >
                              {audioEnabled ? (
                                <Volume2 className="h-4 w-4 mr-2" />
                              ) : (
                                <VolumeX className="h-4 w-4 mr-2" />
                              )}
                              {audioEnabled ? "Mute AI" : "Unmute AI"}
                            </Button>

                            {isSpeaking && (
                              <Button
                                onClick={toggleSpeaking}
                                variant="outline"
                              >
                                <Square className="h-4 w-4 mr-2" /> Stop AI
                                Speaking
                              </Button>
                            )}

                            <Button
                              onClick={toggleRecording}
                              disabled={processingAudio || loading}
                              variant={isRecording ? "destructive" : "outline"}
                            >
                              {processingAudio ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : isRecording ? (
                                <Square className="h-4 w-4 mr-2" />
                              ) : (
                                <Mic className="h-4 w-4 mr-2" />
                              )}
                              {isRecording
                                ? "Stop Recording"
                                : "Start Recording"}
                            </Button>

                            <Button
                              onClick={endCall}
                              disabled={loading}
                              variant="destructive"
                            >
                              <PhoneOff className="h-4 w-4 mr-2" />
                              End Voice Chat
                            </Button>
                          </>
                        )}

                        {!sessionEnded && !isVoiceMode && (
                          <Button
                            onClick={handleEndSession}
                            disabled={loading}
                            variant="secondary"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            End Session & Generate Report
                          </Button>
                        )}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardTitle>
            </CardHeader>

            {/* Deep Conversation Toggle */}
            {!sessionEnded && false && (
              <div className="px-2 sm:px-4 py-2 border-b bg-gray-50/50 sm:flex sm:justify-between sm:items-center">
                <DeepConversationToggle
                  deepConversation={deepConversation}
                  onDeepConversationChange={setDeepConversation}
                  disabled={loading || isVoiceMode}
                />
              </div>
            )}

            {/* Chat Messages */}
            <CardContent className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 bg-gray-50/50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-start space-x-2 sm:space-x-3 
          ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}
        `}
                  >
                    {/* Avatar */}
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarFallback
                        className={
                          message.sender === "ai" && deepConversation
                            ? "bg-blue-100"
                            : ""
                        }
                      >
                        {message.sender === "user" ? (
                          <User className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    {/* Message Bubble */}
                    <div
                      className={`rounded-xl shadow-sm px-3 py-2 sm:px-4 sm:py-2 text-sm leading-relaxed max-w-[85%] sm:max-w-[75%] ${
                        message.sender === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-800 border"
                      }`}
                    >
                      {message.sender === "ai" ? (
                        <div>
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                          {deepConversation && false && (
                            <div className="flex items-center justify-end mt-2 pt-2 border-t border-gray-100">
                              <div className="flex items-center space-x-1 text-xs text-blue-600">
                                <Search className="h-3 w-3" />
                                <span>Deep Conversation</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* AI Typing / Audio Processing */}
              {(loading || processingAudio) && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2 sm:space-x-3 max-w-[85%] sm:max-w-[75%]">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarFallback>
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white rounded-xl px-3 py-2 sm:p-3 border shadow-sm">
                      <div className="flex space-x-1 items-center">
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-blue-500" />
                        <span className="text-xs text-gray-500">
                          {processingAudio
                            ? "Processing audio..."
                            : deepConversation
                            ? "Searching latest info..."
                            : "AI is thinking..."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Session Report */}
              {sessionEnded && generatedReport && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="p-2 sm:p-4">
                    <CardTitle className="text-base sm:text-lg text-green-900 flex items-center">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Session Complete!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4 space-y-4">
                    <p className="text-green-800 text-sm sm:text-base">
                      Your wellness report has been generated and saved.
                    </p>

                    <div className="prose prose-sm max-w-none bg-white p-3 sm:p-4 rounded-md border">
                      <ReactMarkdown>
                        {generatedReport.complete_report}
                      </ReactMarkdown>
                    </div>

                    {generatedReport.key_insights?.length > 0 && (
                      <div className="bg-blue-50 p-2 sm:p-3 rounded-md">
                        <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">
                          Key Insights:
                        </h4>
                        <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                          {generatedReport.key_insights.map(
                            (insight, index) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                {insight}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {generatedReport.recommendations?.length > 0 && (
                      <div className="bg-purple-50 p-2 sm:p-3 rounded-md">
                        <h4 className="font-medium text-purple-900 mb-2 text-sm sm:text-base">
                          Recommendations:
                        </h4>
                        <ul className="text-xs sm:text-sm text-purple-800 space-y-1">
                          {generatedReport.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <span>
                        Session Type: {generatedReport.session_type} • Duration:{" "}
                        {Math.floor(generatedReport.session_duration / 60)}m{" "}
                        {generatedReport.session_duration % 60}s
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push("/employee/reports")}
                      >
                        View All Reports
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500">
                      This report is confidential and intended to help you track
                      your well-being.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Voice Chat UI - Full Screen Overlay */}
            {isVoiceMode && (
              <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
                {/* Background Animation */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
                </div>

                {/* Main Voice Interface */}
                <div className="relative z-10 flex flex-col items-center justify-center text-white">
                  {/* Header */}
                  <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-lg font-medium">
                        Voice Session Active
                      </span>
                    </div>
                    <div className="text-lg font-mono">
                      {formatCallDuration(callDuration)}
                    </div>
                  </div>

                  {/* Central Glowing Circle */}
                  <div className="relative mb-12">
                    {/* Outer glow rings */}
                    <div
                      className={`absolute inset-0 rounded-full ${
                        isRecording
                          ? "animate-ping bg-red-400/30"
                          : isSpeaking
                          ? "animate-pulse bg-green-400/30"
                          : processingAudio
                          ? "animate-spin bg-yellow-400/30"
                          : "animate-pulse bg-blue-400/30"
                      } scale-150`}
                    ></div>

                    <div
                      className={`absolute inset-0 rounded-full ${
                        isRecording
                          ? "animate-pulse bg-red-400/20"
                          : isSpeaking
                          ? "animate-pulse bg-green-400/20"
                          : processingAudio
                          ? "animate-pulse bg-yellow-400/20"
                          : "animate-pulse bg-blue-400/20"
                      } scale-125`}
                    ></div>

                    {/* Main circle */}
                    <div
                      className={`relative w-64 h-64 rounded-full border-4 ${
                        isRecording
                          ? "border-red-400 bg-red-500/20 shadow-red-400/50"
                          : isSpeaking
                          ? "border-green-400 bg-green-500/20 shadow-green-400/50"
                          : processingAudio
                          ? "border-yellow-400 bg-yellow-500/20 shadow-yellow-400/50"
                          : "border-blue-400 bg-blue-500/20 shadow-blue-400/50"
                      } shadow-2xl backdrop-blur-sm flex items-center justify-center transition-all duration-300`}
                    >
                      {/* Inner content */}
                      <div className="text-center">
                        {isRecording && (
                          <>
                            <Mic className="w-16 h-16 mx-auto mb-4 text-red-400 animate-pulse" />
                            <p className="text-xl font-medium text-red-300">
                              Listening...
                            </p>
                            <p className="text-sm text-red-200 mt-2">
                              Speak naturally
                            </p>
                          </>
                        )}

                        {isSpeaking && (
                          <>
                            <Volume2 className="w-16 h-16 mx-auto mb-4 text-green-400 animate-pulse" />
                            <p className="text-xl font-medium text-green-300">
                              AI Speaking...
                            </p>
                            <div className="flex justify-center space-x-1 mt-4">
                              <div className="w-2 h-8 bg-green-400 rounded animate-pulse"></div>
                              <div className="w-2 h-6 bg-green-400 rounded animate-pulse delay-100"></div>
                              <div className="w-2 h-10 bg-green-400 rounded animate-pulse delay-200"></div>
                              <div className="w-2 h-4 bg-green-400 rounded animate-pulse delay-300"></div>
                              <div className="w-2 h-7 bg-green-400 rounded animate-pulse delay-400"></div>
                            </div>
                          </>
                        )}

                        {processingAudio && (
                          <>
                            <Loader2 className="w-16 h-16 mx-auto mb-4 text-yellow-400 animate-spin" />
                            <p className="text-xl font-medium text-yellow-300">
                              Processing...
                            </p>
                            <p className="text-sm text-yellow-200 mt-2">
                              Understanding your message
                            </p>
                          </>
                        )}

                        {!isRecording && !isSpeaking && !processingAudio && (
                          <>
                            <Bot className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                            <p className="text-xl font-medium text-blue-300">
                              Ready to Listen
                            </p>
                            <p className="text-sm text-blue-200 mt-2">
                              Tap to speak
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Text */}
                  <div className="text-center mb-8">
                    {isRecording && (
                      <p className="text-lg text-red-300">
                        🎤 Recording your voice...
                      </p>
                    )}
                    {isSpeaking && (
                      <p className="text-lg text-green-300">
                        🔊 AI is responding...
                      </p>
                    )}
                    {processingAudio && (
                      <p className="text-lg text-yellow-300">
                        ⚡ Processing your message...
                      </p>
                    )}
                    {!isRecording && !isSpeaking && !processingAudio && (
                      <p className="text-lg text-blue-300">
                        💬 Continuous voice conversation
                      </p>
                    )}
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center space-x-6">
                    {/* Record Button */}
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={processingAudio || isSpeaking}
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isRecording
                          ? "bg-red-500 border-red-400 hover:bg-red-600 shadow-red-400/50"
                          : "bg-white/10 border-white/30 hover:bg-white/20 hover:border-white/50"
                      } shadow-lg backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isRecording ? (
                        <Square className="w-6 h-6 text-white" />
                      ) : (
                        <Mic className="w-6 h-6 text-white" />
                      )}
                    </button>

                    {/* Mute/Unmute Button */}
                    <button
                      onClick={() => setAudioEnabled(!audioEnabled)}
                      className="w-16 h-16 rounded-full border-2 border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/50 flex items-center justify-center transition-all duration-300 shadow-lg backdrop-blur-sm"
                    >
                      {audioEnabled ? (
                        <Volume2 className="w-6 h-6 text-white" />
                      ) : (
                        <VolumeX className="w-6 h-6 text-white" />
                      )}
                    </button>

                    {/* End Call Button */}
                    <button
                      onClick={endCall}
                      className="w-16 h-16 rounded-full border-2 border-red-400 bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all duration-300 shadow-lg shadow-red-400/50"
                    >
                      <PhoneOff className="w-6 h-6 text-white" />
                    </button>
                  </div>

                  {/* Instructions */}
                  <div className="absolute bottom-8 left-8 right-8 text-center">
                    <p className="text-white/70 text-sm">
                      Tap and hold the microphone to speak • Voice responses are
                      automatic
                    </p>
                    <p className="text-white/50 text-xs mt-2">
                      End the call when you're ready to receive your wellness
                      report
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t p-4 bg-white">
              <div className="flex space-x-2">
                <Input
                  placeholder={
                    sessionEnded
                      ? "This session has ended."
                      : isVoiceMode
                      ? "Voice mode active - switch to text if needed..."
                      : "Type your message..."
                  }
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={
                    loading || sessionEnded || processingAudio || isVoiceMode
                  }
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={
                    loading ||
                    sessionEnded ||
                    !currentMessage.trim() ||
                    processingAudio ||
                    isVoiceMode
                  }
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {!sessionEnded && !isVoiceMode && (
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send. When you're ready, end the session to get
                  your report.
                </p>
              )}
            </div>
          </Card>
      </div>
    </div>
  );
}
