import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import PeerSupportChatSystem, { 
  ChatUser, 
  ChatGroup, 
  ChatMessage, 
  MessageReaction, 
  VoiceMessageData 
} from '../lib/peer-chat-system';

interface PeerChatInterfaceProps {
  userId: string;
  chatSystem: PeerSupportChatSystem;
  onClose?: () => void;
}

const PeerChatInterface: React.FC<PeerChatInterfaceProps> = ({ userId, chatSystem, onClose }) => {
  const { t } = useTranslation('common');
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [availableGroups, setAvailableGroups] = useState<ChatGroup[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<ChatGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showGroupBrowser, setShowGroupBrowser] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize chat system
  useEffect(() => {
    initializeChat();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, [userId]);

  const initializeChat = async () => {
    try {
      // Get current user data (this would typically come from your auth system)
      const userData = await getCurrentUserData();
      const user = await chatSystem.registerUser(userData);
      setCurrentUser(user);
      
      await loadUserGroups();
      await loadAvailableGroups();
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  const getCurrentUserData = async () => {
    // This would integrate with your existing auth system
    return {
      displayName: `User${Math.floor(Math.random() * 1000)}`,
      languagePreferences: ['en'],
      interests: ['mental_health', 'peer_support'],
      privacySettings: {
        showCountryOfOrigin: false,
        showLanguages: true,
        allowDirectMessages: true,
        dataRetention: 'standard' as const
      }
    };
  };

  const setupEventListeners = () => {
    chatSystem.on('message_sent', handleNewMessage);
    chatSystem.on('user_joined', handleUserJoined);
    chatSystem.on('user_left', handleUserLeft);
    chatSystem.on('reaction_added', handleReactionAdded);
    chatSystem.on('notification', handleNotification);
  };

  const cleanupEventListeners = () => {
    chatSystem.removeAllListeners();
  };

  const handleNewMessage = (message: ChatMessage) => {
    if (message.groupId === activeGroupId) {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    }
  };

  const handleUserJoined = ({ userId: joinedUserId, groupId }: any) => {
    if (groupId === activeGroupId) {
      loadMessages(groupId);
    }
  };

  const handleUserLeft = ({ userId: leftUserId, groupId }: any) => {
    if (groupId === activeGroupId) {
      loadMessages(groupId);
    }
  };

  const handleReactionAdded = ({ messageId, userId: reactorId, emoji }: any) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, reactions: [...msg.reactions.filter(r => r.userId !== reactorId), { emoji, userId: reactorId, timestamp: new Date() }] }
        : msg
    ));
  };

  const handleNotification = (notification: any) => {
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== notification));
    }, 5000);
  };

  const loadUserGroups = async () => {
    // This would get groups the user has joined
    const groups: ChatGroup[] = []; // Implementation depends on your chat system's API
    setJoinedGroups(groups);
    
    if (groups.length > 0 && !activeGroupId) {
      setActiveGroupId(groups[0].id);
      await loadMessages(groups[0].id);
    }
  };

  const loadAvailableGroups = async () => {
    // This would get public groups the user can join
    const groups: ChatGroup[] = []; // Implementation depends on your chat system's API
    setAvailableGroups(groups);
  };

  const loadMessages = async (groupId: string) => {
    try {
      const groupMessages = await chatSystem.getGroupMessages(groupId, userId, 50, 0);
      setMessages(groupMessages);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeGroupId) return;

    try {
      await chatSystem.sendMessage(userId, activeGroupId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    if (!activeGroupId) return;

    // In a real implementation, you'd upload the audio file and get a URL
    const audioUrl = URL.createObjectURL(audioBlob);
    const voiceData: VoiceMessageData = {
      audioUrl,
      duration: 0, // Would be calculated
      language: currentUser?.languagePreferences[0] || 'en'
    };

    try {
      await chatSystem.sendMessage(userId, activeGroupId, '', 'voice', voiceData);
    } catch (error) {
      console.error('Failed to send voice message:', error);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      await chatSystem.addReaction(userId, messageId, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      const success = await chatSystem.joinGroup(userId, groupId);
      if (success) {
        await loadUserGroups();
        setActiveGroupId(groupId);
        await loadMessages(groupId);
        setShowGroupBrowser(false);
      }
    } catch (error) {
      console.error('Failed to join group:', error);
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      const success = await chatSystem.leaveGroup(userId, groupId);
      if (success) {
        await loadUserGroups();
        if (activeGroupId === groupId) {
          setActiveGroupId(joinedGroups[0]?.id || null);
          if (joinedGroups[0]) {
            await loadMessages(joinedGroups[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getGroupIcon = (type: string) => {
    const icons: Record<string, string> = {
      language: '🌐',
      country: '🏠',
      interest: '💭',
      support_topic: '🤝',
      general: '💬'
    };
    return icons[type] || '💬';
  };

  const getUserDisplayName = (senderId: string) => {
    if (senderId === 'system') return 'System';
    if (senderId === userId) return 'You';
    return `User${senderId.slice(-4)}`;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p>Loading chat system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Groups */}
      <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              💬 Peer Support Chat
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span>{currentUser.displayName}</span>
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">My Groups</h3>
              <button
                onClick={() => setShowGroupBrowser(true)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Browse
              </button>
            </div>
            
            <div className="space-y-1">
              {joinedGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setActiveGroupId(group.id);
                    loadMessages(group.id);
                  }}
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                    activeGroupId === group.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getGroupIcon(group.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{group.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {group.members.length} members
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile Summary */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏆</span>
            <span className="text-sm font-medium">Your Badges</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {currentUser.badges.map((badge) => (
              <span
                key={badge.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                title={badge.description}
              >
                <span>{badge.icon}</span>
                <span>{badge.name}</span>
              </span>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Trust Score: {currentUser.trustScore}/100
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeGroupId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <span>{getGroupIcon(joinedGroups.find(g => g.id === activeGroupId)?.type || 'general')}</span>
                    {joinedGroups.find(g => g.id === activeGroupId)?.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {joinedGroups.find(g => g.id === activeGroupId)?.members.length} members
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => leaveGroup(activeGroupId)}
                    className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-200 rounded-md hover:bg-red-50"
                  >
                    Leave Group
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <MessageComponent
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === userId}
                  getUserDisplayName={getUserDisplayName}
                  onAddReaction={addReaction}
                  formatTime={formatTime}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecording 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  🎤
                </button>
                
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Welcome to Peer Support Chat
              </h3>
              <p className="text-gray-600 mb-4">
                Select a group to start chatting with peers who understand your journey
              </p>
              <button
                onClick={() => setShowGroupBrowser(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Browse Groups
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Group Browser Modal */}
      {showGroupBrowser && (
        <GroupBrowserModal
          availableGroups={availableGroups}
          onJoinGroup={joinGroup}
          onClose={() => setShowGroupBrowser(false)}
          getGroupIcon={getGroupIcon}
        />
      )}

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm"
          >
            <div className="text-sm">{notification.data.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Message Component
interface MessageComponentProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  getUserDisplayName: (senderId: string) => string;
  onAddReaction: (messageId: string, emoji: string) => void;
  formatTime: (date: Date) => string;
}

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  isOwnMessage,
  getUserDisplayName,
  onAddReaction,
  formatTime
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const reactionEmojis = ['👍', '❤️', '😊', '🙏', '💪', '🤝'];

  if (message.type === 'system') {
    return (
      <div className="text-center">
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-1' : 'order-2'}`}>
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200'
          }`}
        >
          {!isOwnMessage && (
            <div className="text-xs text-gray-500 mb-1">
              {getUserDisplayName(message.senderId)}
            </div>
          )}
          
          {message.type === 'voice' && message.voiceData ? (
            <div className="flex items-center gap-2">
              <button className="text-lg">🎵</button>
              <div className="flex-1">
                <audio controls src={message.voiceData.audioUrl} className="w-full" />
              </div>
            </div>
          ) : (
            <div>{message.content}</div>
          )}
          
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
              const count = message.reactions.filter(r => r.emoji === emoji).length;
              return (
                <button
                  key={emoji}
                  onClick={() => onAddReaction(message.id, emoji)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs"
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Reaction Picker */}
        <div className="relative">
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="text-gray-400 hover:text-gray-600 text-sm mt-1"
          >
            React
          </button>
          
          {showReactionPicker && (
            <div className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1 z-10">
              {reactionEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    onAddReaction(message.id, emoji);
                    setShowReactionPicker(false);
                  }}
                  className="text-lg hover:bg-gray-100 p-1 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Group Browser Modal
interface GroupBrowserModalProps {
  availableGroups: ChatGroup[];
  onJoinGroup: (groupId: string) => void;
  onClose: () => void;
  getGroupIcon: (type: string) => string;
}

const GroupBrowserModal: React.FC<GroupBrowserModalProps> = ({
  availableGroups,
  onJoinGroup,
  onClose,
  getGroupIcon
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'All Groups' },
    { value: 'language', label: 'Language Groups' },
    { value: 'country', label: 'Country Groups' },
    { value: 'interest', label: 'Interest Groups' },
    { value: 'support_topic', label: 'Support Topics' }
  ];

  const filteredGroups = availableGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || group.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Browse Support Groups</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Search and Filter */}
          <div className="mt-4 space-y-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search groups..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Groups List */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="space-y-3">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{getGroupIcon(group.type)}</span>
                    <div className="flex-1">
                      <h3 className="font-medium">{group.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{group.members.length} members</span>
                        <span className="capitalize">{group.type.replace('_', ' ')}</span>
                        {group.settings.requireApproval && (
                          <span className="text-yellow-600">Requires approval</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onJoinGroup(group.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredGroups.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No groups found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeerChatInterface;
