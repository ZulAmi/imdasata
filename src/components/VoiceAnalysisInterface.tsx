/**
 * SATA Voice Analysis Interface
 * React component for recording and analyzing voice notes
 */

import React, { useState, useRef, useEffect } from 'react';
import { voiceSentimentAnalyzer, VoiceNote, MoodScore, TrendAnalysis, ProactiveIntervention } from '../lib/voice-sentiment-analyzer';
import { useEngagementTracking } from '../lib/engagement-integration';

interface VoiceAnalysisProps {
  userId: string;
  onAnalysisComplete?: (result: any) => void;
  onInterventionTriggered?: (intervention: ProactiveIntervention) => void;
}

const VoiceAnalysisInterface: React.FC<VoiceAnalysisProps> = ({
  userId,
  onAnalysisComplete,
  onInterventionTriggered
}) => {
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [moodTrends, setMoodTrends] = useState<TrendAnalysis | null>(null);
  const [interventions, setInterventions] = useState<ProactiveIntervention[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [privacyMode, setPrivacyMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'record' | 'analyze' | 'trends' | 'interventions'>('record');

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Engagement tracking
  const { trackInteraction, trackFeatureUsage } = useEngagementTracking(userId);

  useEffect(() => {
    // Initialize voice analyzer listeners
    voiceSentimentAnalyzer.on('analysis:completed', handleAnalysisComplete);
    voiceSentimentAnalyzer.on('intervention:triggered', handleInterventionTriggered);
    voiceSentimentAnalyzer.on('mood:calculated', handleMoodCalculated);

    // Load existing data
    loadUserData();

    return () => {
      voiceSentimentAnalyzer.removeAllListeners();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [userId]);

  const loadUserData = () => {
    const trends = voiceSentimentAnalyzer.getUserMoodTrends(userId);
    setMoodTrends(trends);

    const userInterventions = voiceSentimentAnalyzer.getUserInterventions(userId);
    setInterventions(userInterventions);
  };

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result);
    setIsAnalyzing(false);
    loadUserData(); // Refresh trends and interventions
    
    trackInteraction('voice-analysis', 'analysis-completed', {
      moodScore: result.moodScore?.overall,
      riskLevel: result.riskAssessment?.riskLevel
    });

    if (onAnalysisComplete) {
      onAnalysisComplete(result);
    }
  };

  const handleInterventionTriggered = ({ intervention }: { intervention: ProactiveIntervention }) => {
    setInterventions(prev => [intervention, ...prev]);
    
    trackInteraction('voice-analysis', 'intervention-triggered', {
      severity: intervention.severity,
      triggerType: intervention.triggerType
    });

    if (onInterventionTriggered) {
      onInterventionTriggered(intervention);
    }
  };

  const handleMoodCalculated = ({ moodScore }: { moodScore: MoodScore }) => {
    trackFeatureUsage('voice-analysis', 60, 'completed'); // Average 1 minute per analysis
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      trackInteraction('voice-analysis', 'recording-started', {
        language: selectedLanguage,
        privacyMode
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      trackInteraction('voice-analysis', 'recording-stopped', {
        duration: recordingTime,
        language: selectedLanguage
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsAnalyzing(true);
    
    try {
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
        type: 'audio/webm'
      });

      const noteId = await voiceSentimentAnalyzer.uploadVoiceNote(audioFile, userId);
      
      // Add to local state
      const newVoiceNote: VoiceNote = {
        id: noteId,
        userId,
        audioUrl: URL.createObjectURL(audioBlob),
        uploadedAt: new Date(),
        duration: recordingTime,
        language: selectedLanguage,
        isProcessed: false,
        isPrivacyProtected: privacyMode
      };

      setVoiceNotes(prev => [newVoiceNote, ...prev]);

    } catch (error) {
      console.error('Error processing voice note:', error);
      setIsAnalyzing(false);
      alert('Error processing voice note. Please try again.');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMoodColor = (score: number): string => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getMoodEmoji = (score: number): string => {
    if (score >= 80) return '😊';
    if (score >= 60) return '🙂';
    if (score >= 40) return '😐';
    if (score >= 20) return '😔';
    return '😢';
  };

  const getRiskBadgeColor = (level: string): string => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderRecordingInterface = () => (
    <div className="space-y-6">
      {/* Recording Controls */}
      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">🎙️ Voice Note Recording</h3>
        
        {/* Language Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isRecording}
          >
            {voiceSentimentAnalyzer.getSupportedLanguages().map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Privacy Toggle */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={privacyMode}
              onChange={(e) => setPrivacyMode(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isRecording}
            />
            <span className="ml-2 text-sm text-gray-700">
              Enable privacy protection (on-device processing where possible)
            </span>
          </label>
        </div>

        {/* Recording Status */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            isRecording 
              ? isPaused 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isRecording ? (
              <>
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
                }`}></span>
                {isPaused ? 'Paused' : 'Recording'} - {formatTime(recordingTime)}
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                Ready to record
              </>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isAnalyzing}
            >
              <span className="text-xl mr-2">🎙️</span>
              Start Recording
            </button>
          ) : (
            <>
              <button
                onClick={pauseRecording}
                className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
                  isPaused 
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
              >
                <span className="text-xl mr-2">{isPaused ? '▶️' : '⏸️'}</span>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={stopRecording}
                className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <span className="text-xl mr-2">⏹️</span>
                Stop & Analyze
              </button>
            </>
          )}
        </div>

        {isAnalyzing && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
              Analyzing voice note...
            </div>
          </div>
        )}
      </div>

      {/* Recent Voice Notes */}
      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">📋 Recent Voice Notes</h3>
        {voiceNotes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No voice notes recorded yet</p>
        ) : (
          <div className="space-y-3">
            {voiceNotes.slice(0, 5).map((note) => (
              <div key={note.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">
                    {note.uploadedAt.toLocaleDateString()} at {note.uploadedAt.toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    Duration: {formatTime(note.duration)} | Language: {note.language}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {note.isPrivacyProtected && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      🔒 Protected
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded ${
                    note.isProcessed ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {note.isProcessed ? 'Analyzed' : 'Processing'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalysisResults = () => (
    <div className="space-y-6">
      {!analysisResult ? (
        <div className="bg-white rounded-lg p-8 shadow-md border border-gray-200 text-center">
          <div className="text-6xl mb-4">🎙️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Available</h3>
          <p className="text-gray-600 mb-4">Record a voice note to see detailed analysis results.</p>
          <button
            onClick={() => setActiveTab('record')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Record Voice Note
          </button>
        </div>
      ) : (
        <>
          {/* Mood Score Overview */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">📊 Mood Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getMoodColor(analysisResult.moodScore.overall)}`}>
                  {analysisResult.moodScore.overall}
                </div>
                <div className="text-lg">{getMoodEmoji(analysisResult.moodScore.overall)}</div>
                <div className="text-sm text-gray-600">Overall Mood</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getMoodColor(analysisResult.moodScore.emotional)}`}>
                  {analysisResult.moodScore.emotional}
                </div>
                <div className="text-sm text-gray-600">Emotional</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getMoodColor(analysisResult.moodScore.stress)}`}>
                  {analysisResult.moodScore.stress}
                </div>
                <div className="text-sm text-gray-600">Stress Level</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getMoodColor(analysisResult.moodScore.energy)}`}>
                  {analysisResult.moodScore.energy}
                </div>
                <div className="text-sm text-gray-600">Energy</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getMoodColor(analysisResult.moodScore.clarity)}`}>
                  {analysisResult.moodScore.clarity}
                </div>
                <div className="text-sm text-gray-600">Clarity</div>
              </div>
            </div>
          </div>

          {/* Emotion Breakdown */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">🎭 Emotion Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analysisResult.emotions.emotions).map(([emotion, value]) => (
                <div key={emotion} className="text-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(value as number) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm font-medium capitalize">{emotion}</div>
                  <div className="text-xs text-gray-600">{((value as number) * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords and Risk Assessment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">🔍 Key Themes</h3>
              <div className="space-y-3">
                {analysisResult.keywords.concerns.length > 0 && (
                  <div>
                    <h4 className="font-medium text-orange-800 mb-2">Concerns</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.keywords.concerns.map((keyword: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {analysisResult.keywords.supportNeeds.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Support Needs</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.keywords.supportNeeds.map((keyword: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">⚠️ Risk Assessment</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Risk Level</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getRiskBadgeColor(analysisResult.riskAssessment.riskLevel)
                  }`}>
                    {analysisResult.riskAssessment.riskLevel.toUpperCase()}
                  </span>
                </div>
                
                {analysisResult.riskAssessment.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Recommendations</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {analysisResult.riskAssessment.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderMoodTrends = () => (
    <div className="space-y-6">
      {moodTrends && (
        <>
          {/* Trend Overview */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">📈 Mood Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getMoodColor(moodTrends.averageMood)}`}>
                  {moodTrends.averageMood}
                </div>
                <div className="text-sm text-gray-600">Average Mood</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  moodTrends.moodTrend === 'improving' ? 'text-green-600' :
                  moodTrends.moodTrend === 'declining' ? 'text-red-600' :
                  moodTrends.moodTrend === 'concerning' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {moodTrends.moodTrend === 'improving' ? '↗️' :
                   moodTrends.moodTrend === 'declining' ? '↘️' :
                   moodTrends.moodTrend === 'concerning' ? '⚠️' : '➡️'}
                </div>
                <div className="text-sm text-gray-600 capitalize">{moodTrends.moodTrend}</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  moodTrends.volatility < 10 ? 'text-green-600' :
                  moodTrends.volatility < 20 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {moodTrends.volatility}
                </div>
                <div className="text-sm text-gray-600">Volatility</div>
              </div>
              <div className="text-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  getRiskBadgeColor(moodTrends.riskLevel)
                }`}>
                  {moodTrends.riskLevel.toUpperCase()}
                </span>
                <div className="text-sm text-gray-600 mt-1">Risk Level</div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {moodTrends.recommendations.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">💡 Personalized Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moodTrends.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-500 text-xl mr-3">💡</span>
                    <p className="text-sm text-blue-800">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderInterventions = () => (
    <div className="space-y-6">
      {interventions.length === 0 ? (
        <div className="bg-white rounded-lg p-8 shadow-md border border-gray-200 text-center">
          <div className="text-6xl mb-4">🌟</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Interventions Needed</h3>
          <p className="text-gray-600">Great! No concerning patterns detected in your voice notes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {interventions.map((intervention) => (
            <div key={intervention.id} className={`bg-white rounded-lg p-6 shadow-md border-l-4 ${
              intervention.severity === 'critical' ? 'border-red-500' :
              intervention.severity === 'high' ? 'border-orange-500' :
              intervention.severity === 'medium' ? 'border-yellow-500' :
              'border-blue-500'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Wellness Check-in</h3>
                  <p className="text-sm text-gray-600">
                    {intervention.timestamp.toLocaleDateString()} at {intervention.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  intervention.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  intervention.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                  intervention.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {intervention.severity.toUpperCase()}
                </span>
              </div>

              <p className="text-gray-800 mb-4">{intervention.message}</p>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Suggested Actions:</h4>
                {intervention.actions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{action.title}</span>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                    {action.url && (
                      <a
                        href={action.url}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Access
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">🎙️ Voice Sentiment Analysis</h1>
          <p className="text-gray-600">AI-powered emotional insights from your voice notes</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'record', label: 'Record', icon: '🎙️' },
              { id: 'analyze', label: 'Analysis', icon: '📊' },
              { id: 'trends', label: 'Trends', icon: '📈' },
              { id: 'interventions', label: 'Wellness', icon: '🌟' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'record' && renderRecordingInterface()}
        {activeTab === 'analyze' && renderAnalysisResults()}
        {activeTab === 'trends' && renderMoodTrends()}
        {activeTab === 'interventions' && renderInterventions()}
      </div>
    </div>
  );
};

export default VoiceAnalysisInterface;
