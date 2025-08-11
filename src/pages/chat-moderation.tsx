import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import PeerSupportChatSystem, { 
  ChatMessage, 
  ChatGroup, 
  ChatUser, 
  ModerationFlag 
} from '../lib/peer-chat-system';

interface ModerationDashboardProps {
  chatSystem: PeerSupportChatSystem;
}

const ModerationDashboard: React.FC<ModerationDashboardProps> = ({ chatSystem }) => {
  const { t } = useTranslation('common');
  const [flaggedMessages, setFlaggedMessages] = useState<ChatMessage[]>([]);
  const [moderationQueue, setModerationQueue] = useState<ChatMessage[]>([]);
  const [groupStats, setGroupStats] = useState<any[]>([]);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'messages' | 'users' | 'groups' | 'analytics'>('messages');

  useEffect(() => {
    loadModerationData();
  }, []);

  const loadModerationData = async () => {
    // Load flagged messages and moderation queue
    // This would integrate with your chat system's moderation API
    const flagged = await getModerationQueue();
    setFlaggedMessages(flagged.filter(m => m.moderationFlag));
    setModerationQueue(flagged.filter(m => !m.moderationFlag));
    
    // Load group statistics
    const stats = await getGroupModerationStats();
    setGroupStats(stats);
    
    // Load user reports
    const reports = await getUserReports();
    setUserReports(reports);
  };

  const getModerationQueue = async (): Promise<ChatMessage[]> => {
    // Mock implementation - would interface with real moderation system
    return [];
  };

  const getGroupModerationStats = async () => {
    // Mock implementation - would get real group stats
    return [];
  };

  const getUserReports = async () => {
    // Mock implementation - would get real user reports
    return [];
  };

  const handleModerationAction = async (
    messageId: string, 
    action: 'approve' | 'hide' | 'remove' | 'warn_user',
    reason?: string
  ) => {
    try {
      // Process moderation action
      const message = flaggedMessages.find(m => m.id === messageId) || 
                     moderationQueue.find(m => m.id === messageId);
      
      if (!message) return;

      const moderationFlag: ModerationFlag = {
        reason: reason as any || 'inappropriate',
        action: action === 'approve' ? 'none' : action === 'hide' ? 'hide' : 'remove',
        reviewedBy: 'moderator', // Would be current moderator ID
        reviewedAt: new Date()
      };

      // Update message with moderation decision
      message.moderationFlag = moderationFlag;
      message.isModerated = action !== 'approve';

      // Remove from queues
      setFlaggedMessages(prev => prev.filter(m => m.id !== messageId));
      setModerationQueue(prev => prev.filter(m => m.id !== messageId));

      // If warning user, update their trust score
      if (action === 'warn_user') {
        await updateUserTrustScore(message.senderId, -5);
      }

      console.log(`Moderation action: ${action} for message ${messageId}`);
    } catch (error) {
      console.error('Failed to process moderation action:', error);
    }
  };

  const updateUserTrustScore = async (userId: string, change: number) => {
    // Implementation would update user's trust score
    console.log(`Updating trust score for user ${userId} by ${change}`);
  };

  const handleUserAction = async (
    userId: string, 
    action: 'warn' | 'suspend' | 'ban' | 'promote_moderator'
  ) => {
    try {
      switch (action) {
        case 'warn':
          await updateUserTrustScore(userId, -10);
          break;
        case 'suspend':
          // Temporarily suspend user (would implement actual suspension)
          console.log(`Suspending user ${userId}`);
          break;
        case 'ban':
          // Permanently ban user (would implement actual ban)
          console.log(`Banning user ${userId}`);
          break;
        case 'promote_moderator':
          // Promote user to moderator status
          console.log(`Promoting user ${userId} to moderator`);
          break;
      }
    } catch (error) {
      console.error('Failed to process user action:', error);
    }
  };

  const tabs = [
    { id: 'messages', label: 'Messages', icon: '💬', count: flaggedMessages.length + moderationQueue.length },
    { id: 'users', label: 'User Reports', icon: '👤', count: userReports.length },
    { id: 'groups', label: 'Group Management', icon: '👥', count: groupStats.length },
    { id: 'analytics', label: 'Analytics', icon: '📊', count: 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                🛡️ Chat Moderation Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Ensure safe and supportive conversations
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {flaggedMessages.length}
                </div>
                <div className="text-sm text-gray-600">Flagged</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {moderationQueue.length}
                </div>
                <div className="text-sm text-gray-600">In Queue</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            {/* Flagged Messages */}
            {flaggedMessages.length > 0 && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                    🚨 Flagged Messages ({flaggedMessages.length})
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {flaggedMessages.map((message) => (
                    <MessageModerationCard
                      key={message.id}
                      message={message}
                      onAction={handleModerationAction}
                      isUrgent={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Moderation Queue */}
            {moderationQueue.length > 0 && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-yellow-600 flex items-center gap-2">
                    ⏳ Moderation Queue ({moderationQueue.length})
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {moderationQueue.map((message) => (
                    <MessageModerationCard
                      key={message.id}
                      message={message}
                      onAction={handleModerationAction}
                      isUrgent={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {flaggedMessages.length === 0 && moderationQueue.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-green-600 mb-2">
                  All Caught Up!
                </h3>
                <p className="text-gray-600">
                  No messages requiring moderation at this time.
                </p>
              </div>
            )}
          </div>
        )}

        {/* User Reports Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">User Reports & Management</h2>
            </div>
            
            <div className="p-6">
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">👤</div>
                <p>User reports functionality coming soon...</p>
              </div>
            </div>
          </div>
        )}

        {/* Group Management Tab */}
        {activeTab === 'groups' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Group Management</h2>
            </div>
            
            <div className="p-6">
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">👥</div>
                <p>Group management functionality coming soon...</p>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <ModerationAnalytics />
          </div>
        )}
      </div>
    </div>
  );
};

// Message Moderation Card Component
interface MessageModerationCardProps {
  message: ChatMessage;
  onAction: (messageId: string, action: 'approve' | 'hide' | 'remove' | 'warn_user', reason?: string) => void;
  isUrgent: boolean;
}

const MessageModerationCard: React.FC<MessageModerationCardProps> = ({
  message,
  onAction,
  isUrgent
}) => {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [reason, setReason] = useState('');

  const handleAction = () => {
    if (selectedAction) {
      onAction(message.id, selectedAction as any, reason);
      setSelectedAction('');
      setReason('');
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className={`p-6 ${isUrgent ? 'bg-red-50' : 'bg-yellow-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-sm px-2 py-1 rounded-full ${
              isUrgent ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isUrgent ? 'FLAGGED' : 'REVIEW'}
            </span>
            <span className="text-sm text-gray-500">
              From: User{message.senderId.slice(-4)}
            </span>
            <span className="text-sm text-gray-500">
              {formatTime(message.timestamp)}
            </span>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
            <div className="font-medium mb-2">Message Content:</div>
            <div className="text-gray-700">{message.content}</div>
            
            {message.moderationFlag && (
              <div className="mt-3 text-sm">
                <span className="font-medium text-red-600">Flagged for: </span>
                <span className="capitalize">{message.moderationFlag.reason}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose action...</option>
              <option value="approve">Approve Message</option>
              <option value="hide">Hide Message</option>
              <option value="remove">Remove Message</option>
              <option value="warn_user">Warn User</option>
            </select>
            
            {selectedAction && (
              <>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Moderation Analytics Component
const ModerationAnalytics: React.FC = () => {
  const analytics = {
    totalMessages: 1247,
    flaggedMessages: 12,
    approvedMessages: 1235,
    removedMessages: 8,
    warnedUsers: 3,
    suspendedUsers: 1,
    averageResponseTime: '15 minutes',
    topReasons: [
      { reason: 'Inappropriate language', count: 5 },
      { reason: 'Spam', count: 3 },
      { reason: 'Off-topic', count: 2 },
      { reason: 'Harassment', count: 2 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="text-3xl mr-4">💬</div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {analytics.totalMessages}
              </div>
              <div className="text-gray-600">Total Messages</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🚨</div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {analytics.flaggedMessages}
              </div>
              <div className="text-gray-600">Flagged Messages</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="text-3xl mr-4">✅</div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {((analytics.approvedMessages / analytics.totalMessages) * 100).toFixed(1)}%
              </div>
              <div className="text-gray-600">Approval Rate</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="text-3xl mr-4">⏱️</div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {analytics.averageResponseTime}
              </div>
              <div className="text-gray-600">Avg Response</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Flagging Reasons */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Top Flagging Reasons</h3>
        <div className="space-y-3">
          {analytics.topReasons.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="font-medium">{item.reason}</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${(item.count / analytics.flaggedMessages) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Moderation Actions (Last 30 Days)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{analytics.approvedMessages}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{analytics.removedMessages}</div>
            <div className="text-sm text-gray-600">Removed</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{analytics.warnedUsers}</div>
            <div className="text-sm text-gray-600">Users Warned</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{analytics.suspendedUsers}</div>
            <div className="text-sm text-gray-600">Suspended</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};

export default ModerationDashboard;
