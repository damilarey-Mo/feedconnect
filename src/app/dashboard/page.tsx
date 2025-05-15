'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { AnalyticsData, FeedbackResponse } from '@/types/feedback';
import { AudioPlayer } from '@/components/AudioPlayer';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2
    }
  }
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'responses' | 'analytics'>('responses');
  const [feedbackData, setFeedbackData] = useState<FeedbackResponse[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackResponse | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch feedback data
      const feedbackResponse = await fetch('/api/feedback');
      if (!feedbackResponse.ok) {
        throw new Error('Failed to fetch feedback data');
      }
      const feedbackJson = await feedbackResponse.json();
      setFeedbackData(feedbackJson.data || []);

      // Fetch analytics data
      const analyticsResponse = await fetch('/api/analytics');
      if (!analyticsResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const analyticsJson = await analyticsResponse.json();
      setAnalyticsData(analyticsJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownload = () => {
    const dataStr = JSON.stringify(feedbackData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feedback-responses.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFirstResponse = (item: FeedbackResponse) => {
    if (!item.sections) return '';
    
    const sections = Object.values(item.sections);
    if (sections.length === 0) return '';

    const firstSection = sections[0];
    if (!firstSection || !firstSection.response) return '';

    return firstSection.response.length > 50
      ? `${firstSection.response.slice(0, 50)}...`
      : firstSection.response;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">Error: {error}</div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feedback Dashboard</h1>
            <Link
              href="/"
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              ← Back to Form
            </Link>
          </div>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Download Responses
          </button>
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('responses')}
                className={`${
                  activeTab === 'responses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Responses
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'responses' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Feedback Responses</h2>
                <div className="space-y-4">
                  {feedbackData.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedFeedback(item)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedFeedback === item
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                      } border`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="text-sm text-gray-500">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-xs ${
                            item.sentiment?.label === 'positive'
                              ? 'bg-green-100 text-green-800'
                              : item.sentiment?.label === 'negative'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {item.sentiment?.label || 'neutral'}
                        </div>
                      </div>
                      <div className="mt-2">
                        {Object.entries(item.sections || {}).map(([sectionId, section]) => (
                          <div key={sectionId} className="mb-2">
                            <div className="font-medium text-gray-700">{sectionId}</div>
                            {section.response && (
                              <div className="text-gray-600 text-sm mt-1">
                                {section.response}
                              </div>
                            )}
                            {section.voiceResponse && (
                              <div className="text-blue-500 text-sm mt-1">
                                Has voice response
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Response Details</h2>
                {selectedFeedback ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500">
                        Submitted on{' '}
                        {new Date(selectedFeedback.timestamp).toLocaleString()}
                      </div>
                      {selectedFeedback.sentiment && (
                        <div className="mt-2">
                          <span className="font-medium">Sentiment Score: </span>
                          <span
                            className={
                              selectedFeedback.sentiment.score > 0.6
                                ? 'text-green-600'
                                : selectedFeedback.sentiment.score < 0.4
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }
                          >
                            {(selectedFeedback.sentiment.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {Object.entries(selectedFeedback.sections || {}).map(
                        ([sectionId, section]) => (
                          <div key={sectionId} className="border-t pt-4">
                            <h3 className="font-medium text-gray-900">{sectionId}</h3>
                            {section.response && (
                              <div className="mt-2 text-gray-700">
                                {section.response}
                              </div>
                            )}
                            {section.voiceResponse && (
                              <div className="mt-2">
                                <AudioPlayer
                                  src={typeof section.voiceResponse === 'string' 
                                    ? section.voiceResponse 
                                    : section.voiceResponse.audioUrl}
                                />
                                {typeof section.voiceResponse !== 'string' && 
                                  section.voiceResponse.transcription && (
                                    <div className="mt-2 text-sm text-gray-500">
                                      Transcription: {section.voiceResponse.transcription}
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Select a response to view details
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          analyticsData && <AnalyticsDashboard data={analyticsData} />
        )}
      </div>
    </div>
  );
} 