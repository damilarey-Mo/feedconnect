'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VoiceFeedback } from '@/types/feedback';
import { MdMic, MdStop } from 'react-icons/md';

interface VoiceRecorderProps {
  onRecordingComplete: (voiceFeedback: VoiceFeedback) => void;
  onError: (error: string) => void;
}

const buttonVariants = {
  initial: { scale: 1 },
  recording: {
    scale: [1, 1.1, 1],
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: "easeInOut"
    }
  },
  hover: {
    scale: 1.1,
    rotate: [0, -10, 10, 0],
    transition: {
      duration: 0.3
    }
  },
  tap: {
    scale: 0.9,
    rotate: 0
  }
};

const pulseVariants = {
  initial: { opacity: 0, scale: 1 },
  animate: {
    opacity: [0, 0.5, 0],
    scale: [1, 1.5, 1],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: "easeInOut"
    }
  }
};

export default function VoiceRecorder({ onRecordingComplete, onError }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onRecordingComplete({
            audioData: base64Audio,
            duration: recordingDuration,
            timestamp: new Date().toISOString()
          });
        };

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingDuration(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      onError('Unable to access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative flex flex-col items-center space-y-2">
      <motion.div
        className="absolute inset-0 bg-blue-500/20 rounded-full"
        variants={pulseVariants}
        initial="initial"
        animate={isRecording ? "animate" : "initial"}
      />
      <motion.button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        variants={buttonVariants}
        initial="initial"
        animate={isRecording ? "recording" : "initial"}
        whileHover="hover"
        whileTap="tap"
        className={`relative p-4 rounded-full transition-colors duration-300 ${
          isRecording 
            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/50' 
            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50 hover:shadow-blue-500/75'
        }`}
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d"
        }}
      >
        <motion.div
          animate={isRecording ? { rotateY: 180 } : { rotateY: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {isRecording ? <MdStop size={28} /> : <MdMic size={28} />}
        </motion.div>
      </motion.button>
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center space-x-2"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-2 h-2 rounded-full bg-red-500"
          />
          <span className="text-sm font-medium text-gray-300">
            {formatDuration(recordingDuration)}
          </span>
        </motion.div>
      )}
    </div>
  );
} 