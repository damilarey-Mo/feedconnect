import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ApiResponse, AnalyticsData, FeedbackResponse, SentimentType, FeedbackType } from '@/types/feedback';

const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json');

interface LegacyFeedback {
  id: string;
  timestamp: string;
  [key: string]: string;
}

function analyzeSentiment(text: string): { label: SentimentType; score: number; confidence: number } {
  // Simple sentiment analysis based on text length and content
  const words = text.toLowerCase().split(/\s+/);
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'best'];
  const negativeWords = ['bad', 'poor', 'terrible', 'worst', 'hate', 'awful', 'disappointing'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });
  
  let score: number;
  let label: SentimentType;
  let confidence: number = 0.7; // Default confidence
  
  if (positiveCount === 0 && negativeCount === 0) {
    // No sentiment words found, assume neutral
    score = 0.5;
    label = 'neutral';
    confidence = 0.5; // Lower confidence for neutral guesses
  } else {
    const total = positiveCount + negativeCount;
    score = total === 0 ? 0.5 : (positiveCount / total);
    
    if (score > 0.6) {
      label = 'positive';
      confidence = 0.7 + (score - 0.6) * 0.5; // Higher confidence for stronger sentiment
    } else if (score < 0.4) {
      label = 'negative';
      confidence = 0.7 + (0.4 - score) * 0.5; // Higher confidence for stronger sentiment
    } else {
      label = 'neutral';
      confidence = 0.6; // Moderate confidence for neutral
    }
  }

  return { label, score, confidence };
}

function convertLegacyFeedback(legacy: LegacyFeedback): FeedbackResponse {
  try {
    const sections: Record<string, { id: string; text?: string; audio?: { url: string; blob: Blob } }> = {};
    const excludedFields = ['id', 'timestamp'];
    
    Object.entries(legacy).forEach(([key, value]) => {
      if (!excludedFields.includes(key) && value && value.trim()) {
        sections[key] = { 
          id: key,
          text: value.trim()
        };
      }
    });

    // Calculate overall sentiment
    const allText = Object.values(sections)
      .map(section => section.text)
      .filter(Boolean)
      .join(' ');
    
    const sentiment = analyzeSentiment(allText || 'neutral'); // Provide default text if no content

    return {
      id: legacy.id || Date.now().toString(),
      timestamp: legacy.timestamp || new Date().toISOString(),
      type: 'text' as FeedbackType,
      sections,
      sentiment
    };
  } catch (error) {
    console.error('Error converting legacy feedback:', error);
    // Return a valid default feedback response
    return {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'text',
      sections: {},
      sentiment: { label: 'neutral', score: 0.5, confidence: 0.5 }
    };
  }
}

export async function GET(): Promise<NextResponse<ApiResponse<AnalyticsData>>> {
  try {
    // Create default analytics data structure
    const defaultAnalytics: AnalyticsData = {
      totalResponses: 0,
      averageSentiment: 0,
      responsesByType: {
        text: 0,
        voice: 0
      },
      sentimentDistribution: {
        positive: 0,
        neutral: 0,
        negative: 0
      },
      recentTrends: [],
      topSections: []
    };

    // If no feedback file exists, return default analytics
    if (!fs.existsSync(FEEDBACK_FILE)) {
      return NextResponse.json({
        success: true,
        data: defaultAnalytics
      });
    }

    // Read and parse feedback data
    let feedback: FeedbackResponse[];
    try {
      const fileContent = fs.readFileSync(FEEDBACK_FILE, 'utf-8');
      const rawData = JSON.parse(fileContent);
      
      if (!Array.isArray(rawData)) {
        throw new Error('Invalid feedback data format');
      }

      // Convert legacy format to new format if needed
      feedback = rawData.map(item => {
        try {
          if (item.sections && item.sentiment && item.sentiment.label) {
            return item as FeedbackResponse;
          }
          return convertLegacyFeedback(item as LegacyFeedback);
        } catch (error) {
          console.error('Error processing feedback item:', error);
          // Return a valid default feedback response
          return {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: 'text',
            sections: {},
            sentiment: { label: 'neutral', score: 0.5, confidence: 0.5 }
          };
        }
      });
    } catch (error) {
      console.error('Error parsing feedback data:', error);
      return NextResponse.json({
        success: true,
        data: defaultAnalytics
      });
    }

    // Calculate analytics
    const totalResponses = feedback.length;
    
    // Calculate response types
    const responsesByType = feedback.reduce(
      (acc, item) => {
        const type = item.type || 'text';
        acc[type as FeedbackType] = (acc[type as FeedbackType] || 0) + 1;
        return acc;
      },
      { text: 0, voice: 0 } as Record<FeedbackType, number>
    );

    // Calculate sentiment distribution
    const sentimentDistribution = feedback.reduce(
      (acc, item) => {
        if (item.sentiment && item.sentiment.label) {
          acc[item.sentiment.label] = (acc[item.sentiment.label] || 0) + 1;
        }
        return acc;
      },
      {
        positive: 0,
        neutral: 0,
        negative: 0
      } as Record<SentimentType, number>
    );

    // Calculate average sentiment
    const averageSentiment = feedback.length > 0
      ? feedback.reduce((sum, item) => sum + (item.sentiment?.score || 0.5), 0) / feedback.length
      : 0;

    // Calculate section analytics
    const sectionMap = new Map<string, { responseCount: number; totalSentiment: number }>();
    
    feedback.forEach(item => {
      if (item.sections) {
        Object.entries(item.sections).forEach(([sectionId, section]) => {
          const current = sectionMap.get(sectionId) || { responseCount: 0, totalSentiment: 0 };
          if ('response' in section || 'voiceResponse' in section) {
            sectionMap.set(sectionId, {
              responseCount: current.responseCount + 1,
              totalSentiment: current.totalSentiment + (item.sentiment?.score || 0.5)
            });
          }
        });
      }
    });

    const topSections = Array.from(sectionMap.entries())
      .map(([sectionId, data]) => ({
        sectionId,
        responseCount: data.responseCount,
        averageSentiment: data.responseCount > 0 ? data.totalSentiment / data.responseCount : 0
      }))
      .sort((a, b) => b.responseCount - a.responseCount);

    // Calculate recent trends (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const recentTrends = last7Days.map(date => {
      const dayFeedback = feedback.filter(f => f.timestamp.split('T')[0] === date);
      return {
        date,
        count: dayFeedback.length,
        averageSentiment: dayFeedback.length > 0
          ? dayFeedback.reduce((sum, f) => sum + (f.sentiment?.score || 0.5), 0) / dayFeedback.length
          : 0
      };
    });

    const analyticsData: AnalyticsData = {
      totalResponses,
      averageSentiment,
      responsesByType,
      sentimentDistribution,
      topSections,
      recentTrends
    };

    return NextResponse.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate analytics',
          details: error instanceof Error ? error.message : undefined
        }
      },
      { status: 500 }
    );
  }
} 