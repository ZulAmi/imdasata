/**
 * Buddy System Interface Component
 * Main interface for the buddy pairing system with all features
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { buddySystem, BuddyUser, BuddyPair, BuddyInteraction, ConversationStarter } from '../../lib/buddy-system';

interface BuddyInterfaceProps {
  currentUserId: string;
  onClose?: () => void;
}

interface CheckInData {
  quality: 1 | 2 | 3 | 4 | 5;
  moodBefore: number;
  moodAfter: number;
  notes: string;
  conversationStarter?: string;
}

const BuddyInterface: React.FC<BuddyInterfaceProps> = ({ currentUserId, onClose }) => {
  const { t } = useTranslation('common');
  const [currentUser, setCurrentUser] = useState<BuddyUser | null>(null);
  const [buddyUser, setBuddyUser] = useState<BuddyUser | null>(null);
  const [currentPair, setCurrentPair] = useState<BuddyPair | null>(null);
  const [interactions, setInteractions] = useState<BuddyInteraction[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'check-in' | 'stats' | 'settings'>('chat');
  const [isInCall, setIsInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [conversationStarter, setConversationStarter] = useState<ConversationStarter | null>(null);
  const [checkInData, setCheckInData] = useState<CheckInData>({
    quality: 3,
    moodBefore: 5,
    moodAfter: 5,
    notes: '',
  });
  const [showBuddyRequest, setShowBuddyRequest] = useState(false);
  const [showSafetyReport, setShowSafetyReport] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
    type: 'text' | 'voice' | 'check-in' | 'system';
  }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserData();
    setupEventListeners();
    
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [currentUserId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadUserData = () => {
    const user = buddySystem.getUser(currentUserId);
    setCurrentUser(user || null);

    if (user?.currentBuddyId) {
      const buddy = buddySystem.getUser(user.currentBuddyId);
      setBuddyUser(buddy || null);

      const pair = buddySystem.getUserPair(currentUserId);
      setCurrentPair(pair || null);

      if (pair) {
        const pairInteractions = buddySystem.getPairInteractions(pair.id);
        setInteractions(pairInteractions);
      }
    }

    const stats = buddySystem.getUserStats(currentUserId);
    setUserStats(stats);
  };

  const setupEventListeners = () => {
    const handleBuddyPairCreated = (pair: BuddyPair) => {
      if (pair.user1Id === currentUserId || pair.user2Id === currentUserId) {
        loadUserData();
        addSystemMessage(t('buddy_paired', 'You have been paired with a new buddy! 🎉'));
      }
    };

    const handleInteractionRecorded = (interaction: BuddyInteraction) => {
      if (currentPair && interaction.pairId === currentPair.id) {
        setInteractions(prev => [...prev, interaction]);
        loadUserData(); // Refresh stats
      }
    };

    buddySystem.on('buddyPairCreated', handleBuddyPairCreated);
    buddySystem.on('interactionRecorded', handleInteractionRecorded);

    return () => {
      buddySystem.off('buddyPairCreated', handleBuddyPairCreated);
      buddySystem.off('interactionRecorded', handleInteractionRecorded);
    };
  };

  const addSystemMessage = (text: string) => {
    const message = {
      id: `sys_${Date.now()}`,
      senderId: 'system',
      text,
      timestamp: new Date(),
      type: 'system' as const,
    };
    setMessages(prev => [...prev, message]);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !currentPair) return;

    const message = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      text: newMessage.trim(),
      timestamp: new Date(),
      type: 'text' as const,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Record interaction
    buddySystem.recordInteraction(currentPair.id, {
      pairId: currentPair.id,
      initiatorId: currentUserId,
      type: 'text-chat',
      quality: 3, // Default quality
      pointsEarned: 0, // Will be calculated
      mood: { before: 5, after: 5 }, // Default values
      isEmergency: false,
    });
  };

  const startVoiceCall = () => {
    setIsInCall(true);
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    addSystemMessage(t('call_started', 'Voice call started'));
  };

  const endVoiceCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (currentPair && callDuration > 0) {
      buddySystem.recordInteraction(currentPair.id, {
        pairId: currentPair.id,
        initiatorId: currentUserId,
        type: 'voice-call',
        duration: Math.floor(callDuration / 60),
        quality: 4, // Good default for completed calls
        pointsEarned: 0,
        mood: { before: 5, after: 6 }, // Assume positive effect
        isEmergency: false,
      });
    }

    setIsInCall(false);
    setCallDuration(0);
    addSystemMessage(t('call_ended', `Voice call ended. Duration: ${Math.floor(callDuration / 60)}m ${callDuration % 60}s`));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        const message = {
          id: `voice_${Date.now()}`,
          senderId: currentUserId,
          text: `🎵 Voice message (${Math.floor(chunks.length / 10)}s)`,
          timestamp: new Date(),
          type: 'voice' as const,
        };
        setMessages(prev => [...prev, message]);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const getConversationStarter = () => {
    if (!currentPair) return;
    const starter = buddySystem.getConversationStarter(currentPair.id);
    setConversationStarter(starter);
  };

  const submitCheckIn = () => {
    if (!currentPair) return;

    buddySystem.recordInteraction(currentPair.id, {
      pairId: currentPair.id,
      initiatorId: currentUserId,
      type: 'check-in',
      quality: checkInData.quality,
      pointsEarned: 0,
      mood: { before: checkInData.moodBefore, after: checkInData.moodAfter },
      notes: checkInData.notes,
      conversationStarter: checkInData.conversationStarter,
      isEmergency: false,
    });

    addSystemMessage(t('check_in_submitted', 'Check-in completed! +15 points'));
    setActiveTab('chat');
    setCheckInData({
      quality: 3,
      moodBefore: 5,
      moodAfter: 5,
      notes: '',
    });
  };

  const requestNewBuddy = (reason: string) => {
    if (buddySystem.requestNewBuddy(currentUserId, reason)) {
      addSystemMessage(t('new_buddy_requested', 'New buddy request submitted. You will be matched soon!'));
      setShowBuddyRequest(false);
      setTimeout(loadUserData, 1000);
    }
  };

  const submitSafetyReport = (reason: string, description: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
    if (!buddyUser || !currentPair) return;

    buddySystem.reportUser({
      reporterId: currentUserId,
      reportedUserId: buddyUser.id,
      pairId: currentPair.id,
      reason: reason as any,
      description,
      severity,
    });

    addSystemMessage(t('safety_report_submitted', 'Safety report submitted. Thank you for keeping our community safe.'));
    setShowSafetyReport(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMoodEmoji = (mood: number) => {
    const emojis = ['😢', '😟', '😐', '🙂', '😊', '😄', '🤗', '😍', '🥳', '✨'];
    return emojis[Math.min(Math.max(mood - 1, 0), 9)];
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (!currentUser.currentBuddyId || !buddyUser || !currentPair) {
    return (
      <div className="text-center py-8">
        <div className="mb-6">
          <span className="text-6xl">🤝</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {t('finding_buddy', 'Finding Your Perfect Buddy')}
        </h2>
        <p className="text-gray-600 mb-6">
          {t('buddy_search_desc', 'We are matching you with someone who shares your interests and can provide mutual support.')}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">{t('matching_criteria', 'Matching Criteria')}</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <div>• {t('language', 'Language')}: {currentUser.language}</div>
            <div>• {t('interests', 'Interests')}: {currentUser.interests.join(', ') || t('none_specified', 'None specified')}</div>
            <div>• {t('experience_level', 'Experience Level')}: {currentUser.experienceLevel}</div>
            <div>• {t('communication_style', 'Communication Style')}: {currentUser.supportPreferences.communicationStyle}</div>
          </div>
        </div>
        <button
          onClick={() => buddySystem.addToMatchingQueue(currentUserId)}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          {t('refresh_matching', 'Refresh Matching')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🤝</span>
            <div>
              <h2 className="text-lg font-bold">{buddyUser.name}</h2>
              <p className="text-sm opacity-90">
                {t('buddy_since', 'Buddy since')} {currentPair.pairedAt.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-center">
              <div className="text-lg font-bold">{userStats?.totalPoints || 0}</div>
              <div className="text-xs opacity-75">{t('points', 'Points')}</div>
            </div>
            {onClose && (
              <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4">
          {[
            { key: 'chat', label: t('chat', 'Chat'), icon: '💬' },
            { key: 'check-in', label: t('check_in', 'Check-in'), icon: '✅' },
            { key: 'stats', label: t('stats', 'Stats'), icon: '📊' },
            { key: 'settings', label: t('settings', 'Settings'), icon: '⚙️' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-1 px-3 py-2 rounded text-sm transition-colors ${
                activeTab === tab.key
                  ? 'bg-white bg-opacity-20 text-white'
                  : 'text-white text-opacity-75 hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Voice Call Banner */}
            {isInCall && (
              <div className="bg-green-100 border-b border-green-200 p-3 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-green-600 animate-pulse">🔊</span>
                  <span className="text-green-800 font-medium">
                    {t('voice_call_active', 'Voice call active')} - {formatDuration(callDuration)}
                  </span>
                  <button
                    onClick={endVoiceCall}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    {t('end_call', 'End Call')}
                  </button>
                </div>
              </div>
            )}

            {/* Conversation Starter */}
            {conversationStarter && (
              <div className="bg-yellow-50 border-b border-yellow-200 p-3">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600">💡</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-800">{t('conversation_starter', 'Conversation Starter')}</h4>
                    <p className="text-sm text-yellow-700">{conversationStarter.text}</p>
                    {conversationStarter.followUpQuestions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-yellow-600">{t('follow_up_questions', 'Follow-up questions')}:</p>
                        <ul className="text-xs text-yellow-600 list-disc list-inside">
                          {conversationStarter.followUpQuestions.map((q, idx) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setConversationStarter(null)}
                    className="text-yellow-600 hover:text-yellow-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'system'
                        ? 'bg-gray-100 text-gray-700 text-center text-sm'
                        : message.senderId === currentUserId
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p>{message.text}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t bg-gray-50 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <button
                  onClick={getConversationStarter}
                  className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                >
                  💡 {t('get_starter', 'Get Starter')}
                </button>
                {!isInCall ? (
                  <button
                    onClick={startVoiceCall}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    📞 {t('voice_call', 'Voice Call')}
                  </button>
                ) : null}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`px-3 py-1 rounded text-sm ${
                    isRecording
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  {isRecording ? '⏹️ Stop' : '🎤 Voice'}
                </button>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={t('type_message', 'Type your message...')}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {t('send', 'Send')}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'check-in' && (
          <div className="p-6 overflow-y-auto">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">
                {t('buddy_check_in', 'Buddy Check-in')}
              </h3>

              <div className="space-y-6">
                {/* Mood Before */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mood_before', 'How were you feeling before this interaction?')}
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">😢</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={checkInData.moodBefore}
                      onChange={(e) => setCheckInData(prev => ({ ...prev, moodBefore: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-sm">✨</span>
                    <span className="text-lg">{getMoodEmoji(checkInData.moodBefore)}</span>
                  </div>
                  <div className="text-center text-sm text-gray-600 mt-1">{checkInData.moodBefore}/10</div>
                </div>

                {/* Mood After */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mood_after', 'How are you feeling now?')}
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">😢</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={checkInData.moodAfter}
                      onChange={(e) => setCheckInData(prev => ({ ...prev, moodAfter: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-sm">✨</span>
                    <span className="text-lg">{getMoodEmoji(checkInData.moodAfter)}</span>
                  </div>
                  <div className="text-center text-sm text-gray-600 mt-1">{checkInData.moodAfter}/10</div>
                </div>

                {/* Quality Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('interaction_quality', 'How would you rate this interaction?')}
                  </label>
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setCheckInData(prev => ({ ...prev, quality: rating as any }))}
                        className={`text-2xl transition-transform hover:scale-110 ${
                          checkInData.quality >= rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('additional_notes', 'Additional notes (optional)')}
                  </label>
                  <textarea
                    value={checkInData.notes}
                    onChange={(e) => setCheckInData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('notes_placeholder', 'How did this interaction help you? What did you discuss?')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={submitCheckIn}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  {t('submit_check_in', 'Submit Check-in (+15 points)')}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-lg font-bold text-gray-800 text-center">
                {t('buddy_stats', 'Buddy Statistics')}
              </h3>

              {/* User Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{userStats?.totalPoints || 0}</div>
                  <div className="text-sm text-blue-700">{t('total_points', 'Total Points')}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{userStats?.trustScore || 50}</div>
                  <div className="text-sm text-green-700">{t('trust_score', 'Trust Score')}</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{userStats?.totalInteractions || 0}</div>
                  <div className="text-sm text-purple-700">{t('total_interactions', 'Interactions')}</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{userStats?.daysWithCurrentBuddy || 0}</div>
                  <div className="text-sm text-orange-700">{t('days_together', 'Days Together')}</div>
                </div>
              </div>

              {/* Recent Interactions */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">{t('recent_interactions', 'Recent Interactions')}</h4>
                <div className="space-y-2">
                  {interactions.slice(-5).reverse().map(interaction => (
                    <div key={interaction.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>
                            {interaction.type === 'check-in' && '✅'}
                            {interaction.type === 'voice-call' && '📞'}
                            {interaction.type === 'text-chat' && '💬'}
                            {interaction.type === 'goal-update' && '🎯'}
                          </span>
                          <span className="text-sm font-medium">{interaction.type.replace('-', ' ')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-xs ${i < interaction.quality ? 'text-yellow-400' : 'text-gray-300'}`}>
                                ⭐
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-green-600">+{interaction.pointsEarned}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {interaction.timestamp.toLocaleDateString()} {interaction.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">{t('achievements', 'Achievements')}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: t('first_buddy', 'First Buddy'), icon: '🤝', earned: true },
                    { name: t('week_together', 'Week Together'), icon: '📅', earned: userStats?.daysWithCurrentBuddy >= 7 },
                    { name: t('good_listener', 'Good Listener'), icon: '👂', earned: userStats?.totalInteractions >= 10 },
                    { name: t('mood_booster', 'Mood Booster'), icon: '🌟', earned: userStats?.averageInteractionQuality >= 4 },
                  ].map(achievement => (
                    <div
                      key={achievement.name}
                      className={`border rounded-lg p-3 text-center ${
                        achievement.earned
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">{achievement.icon}</div>
                      <div className="text-xs font-medium">{achievement.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6 overflow-y-auto">
            <div className="max-w-md mx-auto space-y-6">
              <h3 className="text-lg font-bold text-gray-800 text-center">
                {t('buddy_settings', 'Buddy Settings')}
              </h3>

              {/* Check-in Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('check_in_frequency', 'Check-in Frequency')}
                </label>
                <select
                  value={currentPair?.checkInFrequency || 'weekly'}
                  onChange={(e) => {
                    if (currentPair) {
                      currentPair.checkInFrequency = e.target.value as any;
                      buddySystem.scheduleNextCheckIn(currentPair.id);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">{t('daily', 'Daily')}</option>
                  <option value="weekly">{t('weekly', 'Weekly')}</option>
                  <option value="biweekly">{t('biweekly', 'Bi-weekly')}</option>
                </select>
              </div>

              {/* Privacy Settings */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">{t('privacy_settings', 'Privacy Settings')}</h4>
                <div className="space-y-3">
                  {[
                    { key: 'allowVoiceMessages', label: t('allow_voice_messages', 'Allow Voice Messages') },
                    { key: 'sharePersonalInfo', label: t('share_personal_info', 'Share Personal Information') },
                    { key: 'shareLocation', label: t('share_location', 'Share Location') },
                  ].map(setting => (
                    <label key={setting.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{setting.label}</span>
                      <input
                        type="checkbox"
                        checked={currentUser.privacySettings[setting.key as keyof typeof currentUser.privacySettings]}
                        onChange={(e) => {
                          const updatedUser = { ...currentUser };
                          updatedUser.privacySettings[setting.key as keyof typeof currentUser.privacySettings] = e.target.checked;
                          setCurrentUser(updatedUser);
                        }}
                        className="rounded"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowBuddyRequest(true)}
                  className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  {t('request_new_buddy', 'Request New Buddy')}
                </button>
                <button
                  onClick={() => setShowSafetyReport(true)}
                  className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  {t('report_safety_concern', 'Report Safety Concern')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showBuddyRequest && (
        <BuddyRequestModal
          onSubmit={requestNewBuddy}
          onClose={() => setShowBuddyRequest(false)}
          t={t}
        />
      )}

      {showSafetyReport && (
        <SafetyReportModal
          onSubmit={submitSafetyReport}
          onClose={() => setShowSafetyReport(false)}
          t={t}
        />
      )}
    </div>
  );
};

// Helper Modals
const BuddyRequestModal: React.FC<{
  onSubmit: (reason: string) => void;
  onClose: () => void;
  t: any;
}> = ({ onSubmit, onClose, t }) => {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {t('request_new_buddy', 'Request New Buddy')}
        </h3>
        <p className="text-gray-600 mb-4">
          {t('new_buddy_explanation', 'Please let us know why you would like to be matched with a new buddy.')}
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('reason_placeholder', 'Share your reason...')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          rows={3}
        />
        <div className="flex space-x-3">
          <button
            onClick={() => onSubmit(reason)}
            disabled={!reason.trim()}
            className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('submit', 'Submit')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
          >
            {t('cancel', 'Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

const SafetyReportModal: React.FC<{
  onSubmit: (reason: string, description: string, severity: 'low' | 'medium' | 'high' | 'critical') => void;
  onClose: () => void;
  t: any;
}> = ({ onSubmit, onClose, t }) => {
  const [reason, setReason] = useState('inappropriate-behavior');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {t('safety_report', 'Safety Report')}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('reason', 'Reason')}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="inappropriate-behavior">{t('inappropriate_behavior', 'Inappropriate Behavior')}</option>
              <option value="harassment">{t('harassment', 'Harassment')}</option>
              <option value="privacy-violation">{t('privacy_violation', 'Privacy Violation')}</option>
              <option value="emergency">{t('emergency', 'Emergency')}</option>
              <option value="other">{t('other', 'Other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('severity', 'Severity')}
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">{t('low', 'Low')}</option>
              <option value="medium">{t('medium', 'Medium')}</option>
              <option value="high">{t('high', 'High')}</option>
              <option value="critical">{t('critical', 'Critical')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('description', 'Description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('describe_incident', 'Please describe what happened...')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => onSubmit(reason, description, severity)}
            disabled={!description.trim()}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('submit_report', 'Submit Report')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
          >
            {t('cancel', 'Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuddyInterface;
