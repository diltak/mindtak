export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'employee' | 'employer';
          first_name: string;
          last_name: string;
          department: string | null;
          company_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: 'employee' | 'employer';
          first_name: string;
          last_name: string;
          department?: string | null;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'employee' | 'employer';
          first_name?: string;
          last_name?: string;
          department?: string | null;
          company_id?: string | null;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          industry: string | null;
          size: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          industry?: string | null;
          size?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          industry?: string | null;
          size?: string | null;
          updated_at?: string;
        };
      };
      mental_health_reports: {
        Row: {
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
          comments: string | null;
          ai_analysis: string | null;
          sentiment_score: number | null;
          emotion_tags: string[] | null;
          risk_level: 'low' | 'medium' | 'high';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          comments?: string | null;
          ai_analysis?: string | null;
          sentiment_score?: number | null;
          emotion_tags?: string[] | null;
          risk_level: 'low' | 'medium' | 'high';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          stress_level?: number;
          mood_rating?: number;
          energy_level?: number;
          work_satisfaction?: number;
          work_life_balance?: number;
          anxiety_level?: number;
          confidence_level?: number;
          sleep_quality?: number;
          overall_wellness?: number;
          comments?: string | null;
          ai_analysis?: string | null;
          sentiment_score?: number | null;
          emotion_tags?: string[] | null;
          risk_level?: 'low' | 'medium' | 'high';
          updated_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          employee_id: string;
          session_type: 'text' | 'voice';
          emotion_analysis: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          session_type: 'text' | 'voice';
          emotion_analysis?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          session_type?: 'text' | 'voice';
          emotion_analysis?: any | null;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          content: string;
          sender: 'user' | 'ai';
          emotion_detected: string | null;
          sentiment_score: number | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          content: string;
          sender: 'user' | 'ai';
          emotion_detected?: string | null;
          sentiment_score?: number | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          content?: string;
          sender?: 'user' | 'ai';
          emotion_detected?: string | null;
          sentiment_score?: number | null;
          timestamp?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'employee' | 'employer';
      risk_level: 'low' | 'medium' | 'high';
      session_type: 'text' | 'voice';
      message_sender: 'user' | 'ai';
    };
  };
}