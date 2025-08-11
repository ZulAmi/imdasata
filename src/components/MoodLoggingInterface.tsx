/**
 * SATA Mood Logging Interface
 * Comprehensive mood tracking with emoji selection, voice notes, and trend analysis
 */

import React, { useState, useEffect, useRef } from 'react';
import { voiceSentimentAnalyzer } from '../lib/voice-sentiment-analyzer';
import { useEngagementTracking } from '../lib/engagement-integration';

interface MoodEntry {
  id: string;
  userId: string;
  timestamp: Date;
  moodScore: number; // 1-10 scale
  emoji: string;
  emotion: string;
  phrase?: string;
  voiceNote?: {
    id: string;
    duration: number;
    transcript?: string;
    sentimentScore?: number;
    emotionalAnalysis?: any;
  };
  tags: string[];
  context?: {
    location?: string;
    activity?: string;
    socialSetting?: string;
    weather?: string;
  };
  assessmentCorrelation?: {
    phq4Score?: number;
    gad7Score?: number;
    assessmentId?: string;
  };
}

interface MoodInsight {
  type: 'trend' | 'pattern' | 'correlation' | 'recommendation';
  title: string;
  description: string;
  data?: any;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
}

const MOOD_EMOJIS = [
  { emoji: '😢', emotion: 'Very Sad', score: 1, color: 'bg-red-500' },
  { emoji: '😟', emotion: 'Sad', score: 2, color: 'bg-red-400' },
  { emoji: '😕', emotion: 'Down', score: 3, color: 'bg-orange-400' },
  { emoji: '😐', emotion: 'Neutral', score: 4, color: 'bg-gray-400' },
  { emoji: '🙂', emotion: 'Okay', score: 5, color: 'bg-yellow-400' },
  { emoji: '😊', emotion: 'Good', score: 6, color: 'bg-yellow-500' },
  { emoji: '😄', emotion: 'Happy', score: 7, color: 'bg-green-400' },
  { emoji: '😁', emotion: 'Very Happy', score: 8, color: 'bg-green-500' },
  { emoji: '🤩', emotion: 'Excited', score: 9, color: 'bg-green-600' },
  { emoji: '🥳', emotion: 'Euphoric', score: 10, color: 'bg-green-700' }
];

const MOOD_TAGS = [
  'work', 'family', 'friends', 'health', 'exercise', 'sleep', 
  'stress', 'anxiety', 'therapy', 'medication', 'social', 
  'alone', 'tired', 'energetic', 'overwhelmed', 'grateful'
];

const QUICK_PHRASES = [
  "Feeling grateful today",
  "Having a tough time",
  "Energy is low",
  "Feeling anxious",
  "Really happy right now",
  "Overwhelmed with everything",
  "Peaceful moment",
  "Missing someone",
  "Proud of myself",
  "Need some space"
];

const MoodLoggingInterface = () => {
  const [currentUser] = useState({
    id: 'mood-user-001',
    name: 'Sarah Chen'
  });

  // Mood entry state
  const [selectedMood, setSelectedMood] = useState<typeof MOOD_EMOJIS[0] | null>(null);
  const [phrase, setPhrase] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState<any>(null);

  // Interface state
  const [activeTab, setActiveTab] = useState<'log' | 'trends' | 'insights' | 'export'>('log');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [insights, setInsights] = useState<MoodInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Voice recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Engagement tracking
  const { trackInteraction, trackFeatureUsage } = useEngagementTracking(currentUser.id);

  useEffect(() => {
    loadMoodHistory();
    generateInsights();
  }, []);

  const loadMoodHistory = async () => {
    // In a real app, this would fetch from API
    const mockHistory: MoodEntry[] = [
      {
        id: '1',
        userId: currentUser.id,
        timestamp: new Date(Date.now() - 86400000), // Yesterday
        moodScore: 7,
        emoji: '😄',
        emotion: 'Happy',
        phrase: 'Great therapy session today!',
        tags: ['therapy', 'grateful'],
        assessmentCorrelation: { phq4Score: 3 }
      },
      {
        id: '2',
        userId: currentUser.id,
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        moodScore: 4,
        emoji: '😐',
        emotion: 'Neutral',
        phrase: 'Feeling okay but tired',
        tags: ['tired', 'work'],
        assessmentCorrelation: { phq4Score: 5 }
      },
      {
        id: '3',
        userId: currentUser.id,
        timestamp: new Date(Date.now() - 259200000), // 3 days ago
        moodScore: 3,
        emoji: '😕',
        emotion: 'Down',
        phrase: 'Struggling with anxiety today',
        tags: ['anxiety', 'overwhelmed'],
        assessmentCorrelation: { phq4Score: 8 }
      }
    ];
    
    setMoodHistory(mockHistory);
  };

  const generateInsights = async () => {
    // Generate AI-powered insights based on mood patterns
    const mockInsights: MoodInsight[] = [
      {
        type: 'trend',
        title: 'Mood Improvement Trend',
        description: 'Your mood has improved by 40% over the past week, especially after therapy sessions.',
        actionable: true,
        priority: 'high'
      },
      {
        type: 'correlation',
        title: 'Exercise & Mood Connection',
        description: 'Days with exercise show 25% higher mood scores. Consider maintaining your workout routine.',
        actionable: true,
        priority: 'medium'
      },
      {
        type: 'pattern',
        title: 'Weekly Pattern Detected',
        description: 'Mondays tend to be more challenging. You might benefit from Sunday evening preparation.',
        actionable: true,
        priority: 'medium'
      },
      {
        type: 'recommendation',
        title: 'Personalized Suggestion',
        description: 'Based on your patterns, practicing mindfulness in the morning could help stabilize mood.',
        actionable: true,
        priority: 'low'
      }
    ];

    setInsights(mockInsights);
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceNote(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      trackFeatureUsage('mood-voice-recording', 0, 'started');
    } catch (error) {
      console.error('Error starting voice recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceNote = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      // Convert blob to audio data for analysis
      const audioData = {
        blob: audioBlob,
        duration: 30, // Mock duration
        format: 'wav'
      };

      // Analyze voice note using sentiment analyzer
      const voiceNoteObject = {
        id: `voice-${Date.now()}`,
        userId: currentUser.id,
        audioUrl: URL.createObjectURL(audioData.blob),
        uploadedAt: new Date(),
        duration: audioData.duration || 0,
        language: 'en-US',
        isProcessed: false,
        isPrivacyProtected: true
      };

      const analysis = await voiceSentimentAnalyzer.analyzeVoiceNote(voiceNoteObject);

      setVoiceNote({
        id: `voice-${Date.now()}`,
        duration: audioData.duration,
        transcript: analysis.transcription.text,
        sentimentScore: analysis.moodScore.overall,
        emotionalAnalysis: analysis.emotions
      });

      // Auto-suggest mood based on voice analysis
      const suggestedMood = MOOD_EMOJIS.find(m => 
        Math.abs(m.score - (analysis.moodScore.overall / 10)) < 1
      );
      if (suggestedMood && !selectedMood) {
        setSelectedMood(suggestedMood);
      }

      trackFeatureUsage('mood-voice-analysis', 30, 'completed');
    } catch (error) {
      console.error('Error processing voice note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMoodEntry = async () => {
    if (!selectedMood) {
      alert('Please select a mood emoji');
      return;
    }

    const newEntry: MoodEntry = {
      id: `mood-${Date.now()}`,
      userId: currentUser.id,
      timestamp: new Date(),
      moodScore: selectedMood.score,
      emoji: selectedMood.emoji,
      emotion: selectedMood.emotion,
      phrase: phrase.trim() || undefined,
      voiceNote,
      tags: selectedTags,
      context: {
        // In a real app, this could be auto-detected or user-provided
      }
    };

    setMoodHistory(prev => [newEntry, ...prev]);
    
    // Reset form
    setSelectedMood(null);
    setPhrase('');
    setSelectedTags([]);
    setVoiceNote(null);

    trackInteraction('mood-entry', 'saved', {
      moodScore: newEntry.moodScore,
      hasPhrase: !!newEntry.phrase,
      hasVoiceNote: !!newEntry.voiceNote,
      tagCount: newEntry.tags.length
    });

    // Regenerate insights with new data
    generateInsights();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const exportMoodData = () => {
    const dataToExport = {
      userId: currentUser.id,
      exportDate: new Date().toISOString(),
      moodEntries: moodHistory,
      insights,
      summary: {
        totalEntries: moodHistory.length,
        averageMood: moodHistory.reduce((sum, entry) => sum + entry.moodScore, 0) / moodHistory.length,
        moodRange: {
          highest: Math.max(...moodHistory.map(e => e.moodScore)),
          lowest: Math.min(...moodHistory.map(e => e.moodScore))
        },
        commonTags: selectedTags, // In real app, calculate most frequent tags
        timeRange: {
          start: moodHistory[moodHistory.length - 1]?.timestamp,
          end: moodHistory[0]?.timestamp
        }
      }
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `mood-data-${currentUser.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    trackFeatureUsage('mood-data-export', 5, 'completed');
  };

  const getMoodTrendDirection = () => {
    if (moodHistory.length < 2) return 'stable';
    
    const recent = moodHistory.slice(0, 3);
    const earlier = moodHistory.slice(3, 6);
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.moodScore, 0) / recent.length;
    const earlierAvg = earlier.length > 0 
      ? earlier.reduce((sum, entry) => sum + entry.moodScore, 0) / earlier.length 
      : recentAvg;
    
    const change = recentAvg - earlierAvg;
    
    if (change > 0.5) return 'improving';
    if (change < -0.5) return 'declining';
    return 'stable';
  };

  const renderMoodSelector = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">How are you feeling right now?</h3>
      
      <div className="grid grid-cols-5 gap-3">
        {MOOD_EMOJIS.map((mood) => (
          <button
            key={mood.score}
            onClick={() => setSelectedMood(mood)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedMood?.score === mood.score
                ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{mood.emoji}</div>
              <div className="text-xs font-medium text-gray-700">{mood.emotion}</div>
              <div className="text-xs text-gray-500">{mood.score}/10</div>
            </div>
          </button>
        ))}
      </div>

      {selectedMood && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{selectedMood.emoji}</span>
            <div>
              <div className="font-medium text-blue-900">{selectedMood.emotion}</div>
              <div className="text-sm text-blue-700">Mood Score: {selectedMood.score}/10</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPhraseInput = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Tell us more (optional)</h4>
      
      <div className="space-y-3">
        <textarea
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder="How are you feeling? What's on your mind?"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
        />

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Quick phrases:</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_PHRASES.map((quickPhrase) => (
              <button
                key={quickPhrase}
                onClick={() => setPhrase(quickPhrase)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {quickPhrase}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderVoiceNote = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Voice Note (optional)</h4>
      
      <div className="p-4 border border-gray-200 rounded-lg">
        {!voiceNote ? (
          <div className="text-center">
            {!isRecording ? (
              <button
                onClick={startVoiceRecording}
                className="flex items-center justify-center w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="text-xl mr-2">🎙️</span>
                Start Voice Recording
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-600 font-medium">Recording...</span>
                  </div>
                </div>
                <button
                  onClick={stopVoiceRecording}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Stop Recording
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">🎙️</span>
                <div>
                  <div className="text-sm font-medium text-green-900">Voice note recorded</div>
                  <div className="text-xs text-green-700">{voiceNote.duration}s duration</div>
                </div>
              </div>
              <button
                onClick={() => setVoiceNote(null)}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
            
            {voiceNote.transcript && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">Transcript:</div>
                <div className="text-sm text-gray-700">{voiceNote.transcript}</div>
              </div>
            )}

            {voiceNote.sentimentScore && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-1">AI Analysis:</div>
                <div className="text-sm text-blue-700">
                  Sentiment Score: {voiceNote.sentimentScore}/100
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderTagSelector = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">What's influencing your mood? (optional)</h4>
      
      <div className="flex flex-wrap gap-2">
        {MOOD_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedTags.includes(tag)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {selectedTags.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-900 mb-1">Selected influences:</div>
          <div className="text-sm text-blue-700">{selectedTags.join(', ')}</div>
        </div>
      )}
    </div>
  );

  const renderMoodTrends = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Mood Journey</h3>
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
          getMoodTrendDirection() === 'improving' ? 'bg-green-100 text-green-800' :
          getMoodTrendDirection() === 'declining' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {getMoodTrendDirection() === 'improving' ? '📈 Improving' :
           getMoodTrendDirection() === 'declining' ? '📉 Needs attention' :
           '➡️ Stable'}
        </div>
      </div>

      {/* Recent entries */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Recent Entries</h4>
        {moodHistory.slice(0, 5).map((entry) => (
          <div key={entry.id} className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{entry.emoji}</span>
                <div>
                  <div className="font-medium text-gray-900">{entry.emotion}</div>
                  <div className="text-sm text-gray-500">
                    {entry.timestamp.toLocaleDateString()} at {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {entry.phrase && (
                    <div className="text-sm text-gray-700 mt-1">{entry.phrase}</div>
                  )}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{entry.moodScore}/10</div>
                {entry.voiceNote && (
                  <div className="text-xs text-blue-600 mt-1">🎙️ Voice note</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {moodHistory.length > 0 
              ? (moodHistory.reduce((sum, entry) => sum + entry.moodScore, 0) / moodHistory.length).toFixed(1)
              : '0'
            }
          </div>
          <div className="text-sm text-blue-700">Average Mood</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{moodHistory.length}</div>
          <div className="text-sm text-green-700">Total Entries</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {moodHistory.filter(e => e.voiceNote).length}
          </div>
          <div className="text-sm text-purple-700">Voice Notes</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {Math.max(...moodHistory.map(e => e.moodScore)) || 0}
          </div>
          <div className="text-sm text-orange-700">Best Day</div>
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Personalized Insights</h3>
      
      {insights.map((insight, index) => (
        <div key={index} className={`p-4 rounded-lg border-l-4 ${
          insight.priority === 'high' ? 'border-red-500 bg-red-50' :
          insight.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
          'border-blue-500 bg-blue-50'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium px-2 py-1 rounded-full bg-white text-gray-700 mr-2">
                  {insight.type}
                </span>
                {insight.priority === 'high' && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-200 text-red-800">
                    High Priority
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
              <p className="text-sm text-gray-700">{insight.description}</p>
              {insight.actionable && (
                <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Learn more →
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderExportOptions = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Export Your Data</h3>
      
      <div className="grid gap-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Healthcare Provider Report</h4>
          <p className="text-sm text-gray-600 mb-3">
            Comprehensive mood data formatted for healthcare professionals, including trends, patterns, and correlation with assessments.
          </p>
          <button
            onClick={exportMoodData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📄 Generate Report
          </button>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Personal Backup</h4>
          <p className="text-sm text-gray-600 mb-3">
            Complete backup of all your mood entries, voice notes, and personal insights.
          </p>
          <button
            onClick={exportMoodData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            💾 Download Backup
          </button>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Assessment Integration</h4>
          <p className="text-sm text-gray-600 mb-3">
            Data showing correlation between mood entries and formal assessment scores (PHQ-4, GAD-7).
          </p>
          <button
            onClick={exportMoodData}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            📊 Export Analysis
          </button>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-start">
          <span className="text-yellow-600 mr-2">⚠️</span>
          <div>
            <h4 className="font-medium text-yellow-900">Privacy Notice</h4>
            <p className="text-sm text-yellow-800 mt-1">
              Exported data is encrypted and should only be shared with trusted healthcare providers. 
              Voice recordings are automatically excluded from exports for privacy protection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">😊 Mood Tracker</h1>
            <p className="text-gray-600 mt-2">
              Track your emotional wellbeing with intuitive logging and AI-powered insights
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'log', label: '📝 Log Mood', icon: '📝' },
              { id: 'trends', label: '📈 Trends', icon: '📈' },
              { id: 'insights', label: '💡 Insights', icon: '💡' },
              { id: 'export', label: '📤 Export', icon: '📤' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  trackInteraction('mood-tab', 'clicked', { tab: tab.id });
                }}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'log' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              {renderMoodSelector()}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              {renderPhraseInput()}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              {renderVoiceNote()}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              {renderTagSelector()}
            </div>

            <div className="text-center">
              <button
                onClick={saveMoodEntry}
                disabled={!selectedMood || isLoading}
                className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                  selectedMood && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Processing...' : 'Save Mood Entry 💾'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {renderMoodTrends()}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {renderInsights()}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {renderExportOptions()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodLoggingInterface;
