import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ApiResponse, VoiceFeedback } from '@/types/feedback';

const VOICE_STORAGE_DIR = path.join(process.cwd(), 'data', 'voice');

// Ensure voice storage directory exists
if (!fs.existsSync(VOICE_STORAGE_DIR)) {
  fs.mkdirSync(VOICE_STORAGE_DIR, { recursive: true });
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<VoiceFeedback>>> {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_INPUT',
            message: 'No audio file provided' 
          } 
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const fileName = `voice_${Date.now()}.webm`;
    const filePath = path.join(VOICE_STORAGE_DIR, fileName);

    fs.writeFileSync(filePath, buffer);

    // Here you would typically:
    // 1. Upload to cloud storage (e.g., AWS S3)
    // 2. Process audio for transcription
    // 3. Run sentiment analysis
    // For now, we'll return a simple response

    const voiceFeedback: VoiceFeedback = {
      audioData: buffer.toString('base64'),
      timestamp: new Date().toISOString(),
      duration: 0, // You would calculate this from the audio file
      audioUrl: `/api/feedback/voice/${fileName}`,
      transcription: undefined // You would add transcription service here
    };

    return NextResponse.json({
      success: true,
      data: voiceFeedback
    });
  } catch (error) {
    console.error('Error handling voice feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process voice feedback'
        }
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve voice recordings
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const fileName = url.pathname.split('/').pop();

  if (!fileName) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'No file name provided'
        }
      },
      { status: 400 }
    );
  }

  const filePath = path.join(VOICE_STORAGE_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Voice recording not found'
        }
      },
      { status: 404 }
    );
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'audio/webm',
      'Content-Disposition': `attachment; filename="${fileName}"`
    }
  });
} 