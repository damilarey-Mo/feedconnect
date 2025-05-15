export type SentimentType = 'positive' | 'neutral' | 'negative';
export type FeedbackType = 'text' | 'voice';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface VoiceFeedback {
  audioData: string;  // base64 encoded audio data
  duration: number;   // duration in seconds
  timestamp: string;  // ISO string timestamp
  transcription?: string; // Optional transcription of voice feedback
  audioUrl: string; // URL to the audio file
}

export interface SentimentAnalysis {
  score: number;
  label: SentimentType;
  confidence: number;
}

export interface Sentiment {
  label: SentimentType;
  score: number;
}

export interface VoiceResponse {
  audioUrl: string;
  blob?: Blob;
  duration?: number;
  transcription?: string;
}

export interface Section {
  response?: string;
  voiceResponse?: string | VoiceResponse;
}

export interface FeedbackSection {
  id: string;
  title: string;
  questions: string[];
}

export interface FormData {
  sections: Record<string, FeedbackSection>;
}

export interface FeedbackResponse {
  id: string;
  timestamp: string;
  type?: string;
  sections: Record<string, {
    id: string;
    text?: string;
    audio?: {
      url: string;
      blob: Blob;
    };
  }>;
  sentiment?: {
    label: SentimentType;
    score: number;
    confidence: number;
  };
  metadata?: {
    browser?: string;
    platform?: string;
    userAgent?: string;
    ipAddress?: string;
  };
}

export interface AnalyticsData {
  totalResponses: number;
  averageSentiment: number;
  responsesByType: Record<FeedbackType, number>;
  sentimentDistribution: Record<SentimentType, number>;
  topSections: Array<{
    sectionId: string;
    responseCount: number;
    averageSentiment: number;
  }>;
  recentTrends: Array<{
    date: string;
    count: number;
    averageSentiment: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
} 