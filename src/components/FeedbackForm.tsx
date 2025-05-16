'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioPlayer } from './AudioPlayer';
import type { FeedbackSection, SentimentType } from '@/types/feedback';

const initialSections: FeedbackSection[] = [
  {
    id: "product_perception",
    title: "Product Perception",
    questions: [
      "How would you describe our CG Collection in terms of quality, design, and uniqueness?",
      "Does CG Collection meet your expectations for a luxury brand? Why or why not?"
    ]
  },
  {
    id: "pricing_value",
    title: "Pricing and Value",
    questions: [
      "Does our pricing tallies with the value of the Items?"
    ]
  },
  {
    id: "brand_image",
    title: "Brand Image & Awareness",
    questions: [
      "Do you feel our brand stands out among other luxury fashion labels? Why or why not?",
      "What comes to mind when you think of our brand?"
    ]
  },
  {
    id: "customer_experience",
    title: "Customer Experience",
    questions: [
      "How was your experience when visiting our store/website?",
      "Was the customer service helpful, responsive, and aligned with luxury standards?"
    ]
  },
  {
    id: "communication",
    title: "Communication & Engagement",
    questions: [
      "Do you feel well-informed about our new collections or promotions?",
      "How do you prefer to hear from us — email, SMS, social media, etc.?"
    ]
  },
  {
    id: "shopping_behavior",
    title: "Shopping Behavior",
    questions: [
      "If you didn't make a purchase recently, what held you back?"
    ]
  },
  {
    id: "competitor_comparison",
    title: "Competitor Comparison",
    questions: [
      "What do you feel we should do better to improve our services?"
    ]
  }
];

// Define local interfaces for storing form data
interface QuestionResponse {
  text?: string;
  audio?: {
    url: string;
    blob: Blob;
  };
}

interface FormData {
  [sectionId: string]: {
    [questionIndex: number]: QuestionResponse;
  };
}

export function FeedbackForm() {
  const [showOverview, setShowOverview] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward
  const [formData, setFormData] = useState<FormData>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const currentSectionData = initialSections[currentSection];
  const progress = ((currentSection * 3 + currentQuestion + 1) / (initialSections.length * 3)) * 100;
  const isLastQuestion = currentQuestion === currentSectionData.questions.length - 1;
  const isLastSection = currentSection === initialSections.length - 1;

  const startRecording = async () => {
    try {
      // Stop any existing recording first
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        stopRecording();
      }

      // Get supported MIME types for recording
      let mimeType = 'audio/webm';
      
      // Test for browser MIME type support
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
      
      console.log(`Using MIME type: ${mimeType}`);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const audioChunks: BlobPart[] = [];

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`Received audio chunk: ${event.data.size} bytes`);
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create blob from chunks
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        console.log(`Created audio blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        
        // Create object URL
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log(`Created audio URL: ${audioUrl}`);
        
        // Update form data with the audio recording
        setFormData(prev => {
          const updatedData = {
            ...prev,
            [currentSectionData.id]: {
              ...prev[currentSectionData.id] || {},
              [currentQuestion]: {
                ...(prev[currentSectionData.id]?.[currentQuestion] || {}),
                audio: { url: audioUrl, blob: audioBlob }
              }
            }
          };
          console.log("Updated form data with audio recording");
          return updatedData;
        });
      };

      // Start recording with timeslice of 250ms to get data more frequently
      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      console.log("Recording started...");
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    try {
      if (mediaRecorderRef.current.state !== 'inactive') {
        console.log("Stopping recording...");
        mediaRecorderRef.current.stop();
      }
      
      if (mediaRecorderRef.current.stream) {
        console.log("Stopping all audio tracks...");
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped track: ${track.kind}, ${track.id}`);
        });
      }
    } catch (err) {
      console.error("Error stopping recording:", err);
    } finally {
      setIsRecording(false);
    }
  };

  const handleNext = () => {
    setDirection(1);
    if (isLastQuestion) {
      if (!isLastSection) {
        setCurrentSection(prev => prev + 1);
        setCurrentQuestion(0);
      }
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    if (currentQuestion === 0) {
      if (currentSection > 0) {
        setCurrentSection(prev => prev - 1);
        setCurrentQuestion(initialSections[currentSection - 1].questions.length - 1);
      }
    } else {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const startSection = (index: number) => {
    setShowOverview(false);
    setCurrentSection(index);
    setCurrentQuestion(0);
    setDirection(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      console.log("Preparing form data for submission...");
      const formDataToSend = new FormData();
      
      // Add metadata about the submission
      formDataToSend.append('submission_time', new Date().toISOString());
      formDataToSend.append('feedback_type', 'product_feedback');
      
      // Track the number of audio files for logging
      let audioFileCount = 0;
      
      // Process each section and question
      Object.entries(formData).forEach(([sectionId, questions]) => {
        Object.entries(questions).forEach(([questionIndex, data]) => {
          const textFieldName = `${sectionId}_${questionIndex}_text`;
          const audioFieldName = `${sectionId}_${questionIndex}_voice`;
          
          // Add text response if available
          if (data.text && data.text.trim()) {
            console.log(`Adding text response for ${textFieldName}`);
            formDataToSend.append(textFieldName, data.text.trim());
          }
          
          // Add audio response if available
          if (data.audio?.blob) {
            console.log(`Adding audio file (${data.audio.blob.size} bytes) for ${audioFieldName}`);
            
            // Create a filename with extension to help the server identify it
            const filename = `voice_${sectionId}_${questionIndex}_${Date.now()}.webm`;
            
            // Append file to FormData with proper filename
            const audioFile = new File([data.audio.blob], filename, { 
              type: data.audio.blob.type 
            });
            
            formDataToSend.append(audioFieldName, audioFile);
            audioFileCount++;
          }
        });
      });
      
      console.log(`Submitting form with ${audioFileCount} audio files...`);

      // Log form data entries for debugging
      Array.from(formDataToSend.entries()).forEach(pair => {
        console.log(`FormData Entry: ${pair[0]}, ${pair[1] instanceof File ? 'File: ' + (pair[1] as File).name : pair[1]}`);
      });

      // Use the PHP endpoint instead of the Next.js API route
      const response = await fetch('/api/feedback/index.php', {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to submit feedback');
      }

      const responseData = await response.json();
      console.log("Submission successful:", responseData);
      
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setErrors({ 
        form: error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressColor = (sectionIndex: number) => {
    if (sectionIndex < currentSection) return 'bg-[#E8DCCC]';
    if (sectionIndex === currentSection) return 'bg-[#E8DCCC] animate-pulse';
    return 'bg-zinc-200';
  };

  if (showOverview) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl font-bold text-zinc-900">Feedback Sections</h2>
          <p className="text-zinc-600">Anonymously share your thoughts on the following areas:</p>
        </motion.div>

        <div className="grid gap-4">
          {initialSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <button
                onClick={() => startSection(index)}
                className="w-full text-left p-6 bg-white rounded-xl shadow-md hover:shadow-xl
                  transform transition-all duration-300 hover:-translate-y-1
                  border border-zinc-100 hover:border-[#E8DCCC]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-900 mb-2 group-hover:text-black">
                      {index + 1}. {section.title}
                    </h3>
                    <p className="text-zinc-500 group-hover:text-zinc-700">
                      {section.questions.length} questions
                    </p>
                  </div>
                  <div className="text-[#E8DCCC] group-hover:translate-x-1 transition-transform">
                    →
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Enhanced Progress Indicator */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm text-zinc-500">
          <button
            onClick={() => setShowOverview(true)}
            className="hover:text-zinc-900 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Overview
          </button>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        
        <div className="flex gap-1">
          {initialSections.map((section, index) => (
            <div key={section.id} className="flex-1">
              <div className={`h-2 rounded-full transition-colors duration-500 ${getProgressColor(index)}`} />
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentSection}-${currentQuestion}`}
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -50 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className="bg-white rounded-xl p-8 shadow-lg relative"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute top-4 right-4 text-sm text-zinc-400"
          >
            Question {currentQuestion + 1}/{currentSectionData.questions.length}
          </motion.div>

          <motion.h2 
            className="text-2xl font-bold text-zinc-900 mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {currentSectionData.title}
          </motion.h2>
          
          <motion.p 
            className="text-lg text-zinc-700 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {currentSectionData.questions[currentQuestion]}
          </motion.p>

          <div className="space-y-6">
            <textarea
              value={formData[currentSectionData.id]?.[currentQuestion]?.text || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                [currentSectionData.id]: {
                  ...prev[currentSectionData.id] || {},
                  [currentQuestion]: {
                    ...(prev[currentSectionData.id]?.[currentQuestion] || {}),
                    text: e.target.value
                  }
                }
              }))}
              placeholder="Type your response here..."
              className="w-full p-4 rounded-lg bg-[#F3EEE7] text-black placeholder-zinc-500
                border border-zinc-200 focus:border-[#DFD3C3] focus:ring-2 focus:ring-[#DFD3C3]
                transition-all duration-200 min-h-[120px] resize-y"
            />

            <div className="flex items-center gap-4">
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-2 bg-[#E8DCCC] text-black rounded-lg
                    hover:bg-[#DFD3C3] transition-all duration-200
                    border border-[#E8DCCC] hover:border-[#DFD3C3]
                    shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Stop Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-4 py-2 bg-[#E8DCCC] text-black rounded-lg
                    hover:bg-[#DFD3C3] transition-all duration-200
                    border border-[#E8DCCC] hover:border-[#DFD3C3]
                    shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Record Voice
                </button>
              )}
            </div>

            {formData[currentSectionData.id]?.[currentQuestion]?.audio && (
              <div className="mt-4">
                <AudioPlayer
                  src={formData[currentSectionData.id]?.[currentQuestion]?.audio?.url || ''}
                  onDelete={() => {
                    setFormData(prev => ({
                      ...prev,
                      [currentSectionData.id]: {
                        ...prev[currentSectionData.id] || {},
                        [currentQuestion]: {
                          ...(prev[currentSectionData.id]?.[currentQuestion] || {}),
                          audio: undefined
                        }
                      }
                    }));
                  }}
                  showDelete
                />
              </div>
            )}
          </div>

          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentSection === 0 && currentQuestion === 0}
              className="px-6 py-3 bg-[#E8DCCC] text-black rounded-xl
                hover:bg-[#DFD3C3] transition-all duration-300
                border border-[#E8DCCC] hover:border-[#DFD3C3]
                shadow-md hover:shadow-lg disabled:opacity-50
                disabled:cursor-not-allowed font-semibold"
            >
              Back
            </button>

            {isLastSection && isLastQuestion ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#E8DCCC] text-black rounded-xl
                  hover:bg-[#DFD3C3] transition-all duration-300
                  border border-[#E8DCCC] hover:border-[#DFD3C3]
                  shadow-md hover:shadow-lg disabled:opacity-50
                  disabled:cursor-not-allowed font-semibold
                  flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-[#E8DCCC] text-black rounded-xl
                  hover:bg-[#DFD3C3] transition-all duration-300
                  border border-[#E8DCCC] hover:border-[#DFD3C3]
                  shadow-md hover:shadow-lg font-semibold"
              >
                Next
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {submitSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg text-center"
        >
          Thank you for your valuable feedback!
        </motion.div>
      )}
    </div>
  );
} 