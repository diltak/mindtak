export interface User {
  id: string;
  email: string;
  role: 'employee' | 'employer';
  first_name: string;
  last_name: string;
  department?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  created_at: string;
  updated_at: string;
}

export interface MentalHealthReport {
  id: string;
  employee_id: string;
  stress_level: number;
  mood_rating: number;
  energy_level: number;
  work_satisfaction: number;
  work_life_balance: number;
  anxiety_level: number;
  confidence_level: number;
  sleep_quality: number;
  overall_wellness: number;
  comments?: string;
  ai_analysis?: string;
  sentiment_score?: number;
  emotion_tags?: string[];
  risk_level: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  employee_id: string;
  session_type: 'text' | 'voice';
  messages: ChatMessage[];
  emotion_analysis?: EmotionAnalysis;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
  sender: 'user' | 'ai';
  emotion_detected?: string;
  sentiment_score?: number;
  timestamp: string;
}

export interface EmotionAnalysis {
  primary_emotion: string;
  emotion_confidence: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  stress_indicators: string[];
  risk_assessment: 'low' | 'medium' | 'high';
}

export interface DashboardStats {
  total_reports: number;
  average_mood: number;
  average_stress: number;
  high_risk_employees: number;
  trend_direction: 'up' | 'down' | 'stable';
}

export interface EmployeeStats {
  employee_id: string;
  latest_mood: number;
  latest_stress: number;
  risk_level: 'low' | 'medium' | 'high';
  last_report_date: string;
  trend: 'improving' | 'declining' | 'stable';
}