/**
 * SATA Gamification Admin Dashboard
 * Administrative interface for managing the gamification system
 */

import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  gamificationSystem, 
  UserProfile, 
  PointTransaction, 
  Reward, 
  QRRedemption 
} from '../lib/gamification-system';

const GamificationAdminPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'rewards' | 'transactions' | 'analytics'>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showManualPointsModal, setShowManualPointsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(gamificationSystem.getAllUsers());
    setSystemStats(gamificationSystem.getSystemStats());
    
    // Get all transactions from all users
    const allTransactions: PointTransaction[] = [];
    gamificationSystem.getAllUsers().forEach(user => {
      const userTransactions = gamificationSystem.getTransactions(user.userId);
      allTransactions.push(...userTransactions);
    });
    setTransactions(allTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  };

  const handleAwardPoints = (userId: string, points: number, description: string) => {
    gamificationSystem.awardPoints(userId, 'achievement', points, description, 'admin-manual');
    loadData();
    setShowManualPointsModal(false);
  };

  const renderOverview = () => {
    if (!systemStats) return null;

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{systemStats.totalUsers}</p>
              </div>
              <div className="text-blue-500 text-3xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Users (7d)</p>
                <p className="text-2xl font-bold text-green-600">{systemStats.activeUsers}</p>
              </div>
              <div className="text-green-500 text-3xl">🔥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Points Awarded</p>
                <p className="text-2xl font-bold text-purple-600">
                  {systemStats.totalPointsAwarded.toLocaleString()}
                </p>
              </div>
              <div className="text-purple-500 text-3xl">💎</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Rewards Redeemed</p>
                <p className="text-2xl font-bold text-orange-600">{systemStats.rewardsRedeemed}</p>
              </div>
              <div className="text-orange-500 text-3xl">🎁</div>
            </div>
          </div>
        </div>

        {/* Charts and Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">User Engagement</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Average Level</span>
                <span className="font-semibold">{systemStats.averageLevel.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Achievements</span>
                <span className="font-semibold">{systemStats.totalAchievements}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Points Spent</span>
                <span className="font-semibold">{systemStats.totalPointsSpent.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-gray-500">
                      User: {users.find(u => u.userId === transaction.userId)?.username || 'Unknown'}
                    </p>
                  </div>
                  <div className={`font-semibold ${
                    transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'earn' ? '+' : '-'}{Math.abs(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Top Users</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Rank</th>
                  <th className="text-left py-2">User</th>
                  <th className="text-left py-2">Level</th>
                  <th className="text-left py-2">Points</th>
                  <th className="text-left py-2">Streak</th>
                  <th className="text-left py-2">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .sort((a, b) => b.totalPoints - a.totalPoints)
                  .slice(0, 10)
                  .map((user, index) => (
                    <tr key={user.userId} className="border-b border-gray-100">
                      <td className="py-2">{index + 1}</td>
                      <td className="py-2 font-medium">{user.username}</td>
                      <td className="py-2">Level {user.currentLevel}</td>
                      <td className="py-2">{user.totalPoints.toLocaleString()}</td>
                      <td className="py-2">{user.currentStreak} days</td>
                      <td className="py-2 text-sm text-gray-600">
                        {user.lastActive.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">User Management</h3>
          <button
            onClick={() => setShowManualPointsModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Award Points Manually
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Level</th>
                  <th className="text-left py-3 px-4">Total Points</th>
                  <th className="text-left py-3 px-4">Available Points</th>
                  <th className="text-left py-3 px-4">Achievements</th>
                  <th className="text-left py-3 px-4">Current Streak</th>
                  <th className="text-left py-3 px-4">Last Active</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-600">{user.userId}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">Level {user.currentLevel}</td>
                    <td className="py-3 px-4">{user.totalPoints.toLocaleString()}</td>
                    <td className="py-3 px-4">{user.availablePoints.toLocaleString()}</td>
                    <td className="py-3 px-4">{user.achievements.length}</td>
                    <td className="py-3 px-4">{user.currentStreak} days</td>
                    <td className="py-3 px-4 text-sm">
                      {user.lastActive.toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTransactions = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Source</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 50).map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      {transaction.timestamp.toLocaleDateString()} {transaction.timestamp.toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      {users.find(u => u.userId === transaction.userId)?.username || 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.type === 'earn' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize">{transaction.category.replace('-', ' ')}</td>
                    <td className={`py-3 px-4 font-semibold ${
                      transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'earn' ? '+' : '-'}{Math.abs(transaction.amount)}
                    </td>
                    <td className="py-3 px-4">{transaction.description}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{transaction.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Gamification Admin - SATA Mental Health Platform</title>
        <meta name="description" content="Administrative dashboard for the SATA gamification system" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🎮 Gamification Admin</h1>
                <p className="text-gray-600">Manage the SATA gamification system</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-semibold">
                    {systemStats?.totalUsers || 0} Total Users
                  </div>
                  <div className="text-sm text-gray-600">
                    {systemStats?.activeUsers || 0} Active (7d)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'users', label: 'Users', icon: '👥' },
                { id: 'transactions', label: 'Transactions', icon: '💳' },
                { id: 'analytics', label: 'Analytics', icon: '📈' },
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
        <div className="max-w-7xl mx-auto px-4 py-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'transactions' && renderTransactions()}
          {activeTab === 'analytics' && renderOverview()} {/* Simplified for now */}
        </div>

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-2xl mx-4 w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Username</label>
                    <p className="font-medium">{selectedUser.username}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">User ID</label>
                    <p className="font-medium font-mono text-sm">{selectedUser.userId}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Current Level</label>
                    <p className="font-medium">Level {selectedUser.currentLevel}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Total Points</label>
                    <p className="font-medium">{selectedUser.totalPoints.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Available Points</label>
                    <p className="font-medium">{selectedUser.availablePoints.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Current Streak</label>
                    <p className="font-medium">{selectedUser.currentStreak} days</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Achievements ({selectedUser.achievements.length})</label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedUser.achievements.map((achievement) => (
                      <div key={achievement.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{achievement.icon}</span>
                          <div>
                            <p className="font-medium text-sm">{achievement.name}</p>
                            <p className="text-xs text-gray-600">{achievement.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Recent Transactions</label>
                  <div className="mt-2 space-y-2">
                    {gamificationSystem.getTransactions(selectedUser.userId).slice(0, 10).map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="text-xs text-gray-600">{transaction.timestamp.toLocaleDateString()}</p>
                        </div>
                        <div className={`font-semibold text-sm ${
                          transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'earn' ? '+' : '-'}{Math.abs(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Points Award Modal */}
        {showManualPointsModal && (
          <ManualPointsModal
            users={users}
            onAward={handleAwardPoints}
            onClose={() => setShowManualPointsModal(false)}
          />
        )}
      </div>
    </>
  );
};

interface ManualPointsModalProps {
  users: UserProfile[];
  onAward: (userId: string, points: number, description: string) => void;
  onClose: () => void;
}

const ManualPointsModal: React.FC<ManualPointsModalProps> = ({ users, onAward, onClose }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [points, setPoints] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId && points && description) {
      onAward(selectedUserId, parseInt(points), description);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md mx-4 w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Award Points Manually</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.username} (Level {user.currentLevel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Points to Award
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              min="1"
              max="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Special bonus for excellent participation"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Award Points
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GamificationAdminPage;
