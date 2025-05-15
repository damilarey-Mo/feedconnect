import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ApiResponse, FeedbackResponse, SentimentType, FeedbackSection } from '@/types/feedback';
import { headers } from 'next/headers';

const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json');
const FEEDBACK_DIR = path.join(process.cwd(), 'data');

// Ensure feedback directory exists
if (!fs.existsSync(FEEDBACK_DIR)) {
  fs.mkdirSync(FEEDBACK_DIR, { recursive: true });
}

// Initialize feedback file if it doesn't exist
if (!fs.existsSync(FEEDBACK_FILE)) {
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify([]));
}

// Simple sentiment analysis function (replace with a more sophisticated solution in production)
function analyzeSentiment(text: string) {
  const positiveWords = ['great', 'excellent', 'good', 'amazing', 'love', 'perfect', 'best'];
  const negativeWords = ['bad', 'poor', 'terrible', 'worst', 'hate', 'disappointing', 'awful'];
  
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 1;
    if (negativeWords.includes(word)) score -= 1;
  });
  
  const normalizedScore = Math.tanh(score / 5); // Convert to range [-1, 1]
  
  let label: SentimentType = 'neutral';
  if (normalizedScore > 0.3) label = 'positive';
  else if (normalizedScore < -0.3) label = 'negative';
  
  return {
    score: normalizedScore,
    label,
    confidence: Math.abs(normalizedScore)
  };
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<FeedbackResponse>>> {
  try {
    const headersList = headers();
    const contentType = request.headers.get('content-type') || '';
    let body;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        sections: Object.fromEntries(
          Array.from(formData.entries()).map(([key, value]) => {
            const [sectionId, type] = key.split('_');
            return [sectionId, {
              id: sectionId,
              [type === 'voice' ? 'voiceResponse' : 'response']: value
            }];
          })
        )
      };
    } else {
      body = await request.json();
    }

    const existingFeedback: FeedbackResponse[] = fs.existsSync(FEEDBACK_FILE)
      ? JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'))
      : [];

    // Analyze sentiment for text responses only
    const allText = Object.values(body.sections)
      .map(section => (section as FeedbackSection).response)
      .filter(Boolean)
      .join(' ');
    
    const sentiment = analyzeSentiment(allText);

    const feedback: FeedbackResponse = {
      id: `feedback_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: body.type || 'text',
      sections: body.sections,
      sentiment,
      metadata: {
        browser: headersList.get('user-agent') || 'unknown',
        platform: headersList.get('sec-ch-ua-platform') || 'unknown',
        userAgent: headersList.get('user-agent') || 'unknown',
        ipAddress: headersList.get('x-forwarded-for') || 'unknown',
      }
    };

    existingFeedback.push(feedback);
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(existingFeedback, null, 2));

    return NextResponse.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to save feedback'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse<ApiResponse<FeedbackResponse[]>>> {
  try {
    if (!fs.existsSync(FEEDBACK_FILE)) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const feedback: FeedbackResponse[] = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'));
    return NextResponse.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error reading feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to read feedback'
        }
      },
      { status: 500 }
    );
  }
} 