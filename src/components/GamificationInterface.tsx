/**
 * SATA Gamification Interface Component
 * React interface for the comprehensive gamification system
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  gamificationSystem, 
  UserProfile, 
  PointTransaction, 
  Achievement, 
  Reward, 
  QRRedemption, 
  LeaderboardEntry,
  Level
} from '../lib/gamification-system';

interface GamificationInterfaceProps {
  userId: string;
  initialUser?: UserProfile;
}

const GamificationInterface: React.FC<GamificationInterfaceProps> = ({ 
  userId, 
  initialUser 
}) => {
  const [user, setUser] = useState<UserProfile | null>(initialUser || null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'achievements' | 'rewards' | 'leaderboard' | 'stats'>('dashboard');
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [qrRedemption, setQrRedemption] = useState<QRRedemption | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [levelUpAnimation, setLevelUpAnimation] = useState<{ show: boolean; level: number; levelInfo?: Level }>({ show: false, level: 0 });
  const [achievementPopup, setAchievementPopup] = useState<{ show: boolean; achievement?: Achievement }>({ show: false });
  const animationTimeout = useRef<NodeJS.Timeout>();

  // Load user data and set up event listeners
  useEffect(() => {
    loadUserData();
    setupEventListeners();
    
    return () => {
      // Cleanup event listeners
      gamificationSystem.removeAllListeners();
      if (animationTimeout.current) {
        clearTimeout(animationTimeout.current);
      }
    };
  }, [userId]);

  const loadUserData = () => {
    let currentUser = gamificationSystem.getUser(userId);
    
    if (!currentUser) {
      // Create user if doesn't exist
      currentUser = gamificationSystem.createUser({
        userId,
        username: `User_${userId.slice(-6)}`,
        email: undefined
      });
    }
    
    setUser(currentUser);
    setTransactions(gamificationSystem.getTransactions(userId)?.slice(0, 20) || []);
    setAchievements(currentUser.achievements);
    setAvailableRewards(gamificationSystem.getAvailableRewards(userId));
    setLeaderboard(gamificationSystem.getLeaderboard('all-time', 10));
    setUserStats(gamificationSystem.getUserStats(userId));
  };

  const setupEventListeners = () => {
    gamificationSystem.on('pointsAwarded', (transaction: PointTransaction) => {
      if (transaction.userId === userId) {
        loadUserData();
        showPointsAnimation(transaction.amount);
      }
    });

    gamificationSystem.on('levelUp', (data: { user: UserProfile; newLevel: number; levelInfo: Level }) => {
      if (data.user.userId === userId) {
        setLevelUpAnimation({ show: true, level: data.newLevel, levelInfo: data.levelInfo });
        setTimeout(() => {
          setLevelUpAnimation({ show: false, level: 0 });
        }, 4000);
        loadUserData();
      }
    });

    gamificationSystem.on('achievementUnlocked', (data: { user: UserProfile; achievement: Achievement }) => {
      if (data.user.userId === userId) {
        setAchievementPopup({ show: true, achievement: data.achievement });
        setTimeout(() => {
          setAchievementPopup({ show: false });
        }, 5000);
        loadUserData();
      }
    });

    gamificationSystem.on('rewardRedeemed', (data: { user: UserProfile; reward: Reward; redemption: QRRedemption }) => {
      if (data.user.userId === userId) {
        setQrRedemption(data.redemption);
        setShowQRModal(true);
        loadUserData();
      }
    });
  };

  const showPointsAnimation = (points: number) => {
    // In a real implementation, you'd create a floating animation
    console.log(`+${points} points earned!`);
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!user || user.availablePoints < reward.pointCost) {
      alert('Insufficient points!');
      return;
    }

    try {
      const redemption = await gamificationSystem.redeemReward(userId, reward.id);
      if (redemption) {
        setQrRedemption(redemption);
        setShowQRModal(true);
        setSelectedReward(null);
        loadUserData();
      }
    } catch (error) {
      alert('Failed to redeem reward. Please try again.');
    }
  };

  const renderDashboard = () => {
    if (!user || !userStats) return null;

    const currentLevel = userStats.level;
    const nextLevel = userStats.nextLevel;
    const progressPercent = nextLevel ? 
      ((user.totalPoints - currentLevel.pointsRequired) / (nextLevel.pointsRequired - currentLevel.pointsRequired)) * 100 : 100;

    return (
      <div className="space-y-6">
        {/* User Level & Progress */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{currentLevel?.name || 'Newcomer'}</h2>
              <p className="text-blue-100">Level {user.currentLevel}</p>
            </div>
            <div className="text-4xl">{currentLevel?.badge || '🌱'}</div>
          </div>
          
          {nextLevel && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to {nextLevel.name}</span>
                <span>{userStats.pointsToNextLevel} points to go</span>
              </div>
              <div className="w-full bg-blue-400 rounded-full h-3">
                <div 
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${Math.max(progressPercent, 5)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Points Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Available Points</p>
                <p className="text-2xl font-bold text-green-600">{user.availablePoints.toLocaleString()}</p>
              </div>
              <div className="text-green-500 text-2xl">💎</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Earned</p>
                <p className="text-2xl font-bold text-blue-600">{user.lifetimePoints.toLocaleString()}</p>
              </div>
              <div className="text-blue-500 text-2xl">⭐</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Current Streak</p>
                <p className="text-2xl font-bold text-orange-600">{user.currentStreak} days</p>
              </div>
              <div className="text-orange-500 text-2xl">🔥</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((transaction, index) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    transaction.type === 'earn' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-600">
                      {transaction.timestamp.toLocaleDateString()} at {transaction.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
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

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => {
                gamificationSystem.recordDailyCheckIn(userId, 8, 'Feeling good today!');
              }}
              className="p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
            >
              <div className="text-2xl mb-2">✅</div>
              <div className="text-sm font-medium">Daily Check-in</div>
            </button>
            
            <button 
              onClick={() => {
                gamificationSystem.recordAssessment(userId, 'PHQ-4', 8);
              }}
              className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-medium">Take Assessment</div>
            </button>
            
            <button 
              onClick={() => {
                gamificationSystem.recordEducationalEngagement(userId, 'article', 300);
              }}
              className="p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
            >
              <div className="text-2xl mb-2">📚</div>
              <div className="text-sm font-medium">Learn Something</div>
            </button>
            
            <button 
              onClick={() => {
                gamificationSystem.recordPeerSupportActivity(userId, 'support-given', 5);
              }}
              className="p-4 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
            >
              <div className="text-2xl mb-2">🤝</div>
              <div className="text-sm font-medium">Help Others</div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAchievements = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Your Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className={`p-4 rounded-lg border-2 ${
                  achievement.rarity === 'legendary' ? 'border-yellow-300 bg-yellow-50' :
                  achievement.rarity === 'epic' ? 'border-purple-300 bg-purple-50' :
                  achievement.rarity === 'rare' ? 'border-blue-300 bg-blue-50' :
                  'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    achievement.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                    achievement.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                    achievement.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {achievement.rarity.toUpperCase()}
                  </div>
                </div>
                <h4 className="font-semibold">{achievement.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-600">+{achievement.points} points</span>
                  <span className="text-xs text-gray-500">
                    {achievement.unlockedAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            
            {achievements.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🏆</div>
                <p>No achievements yet. Start engaging to unlock them!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRewards = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Available Rewards</h3>
            <div className="text-sm text-gray-600">
              You have {user?.availablePoints.toLocaleString()} points to spend
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRewards.map((reward) => (
              <div key={reward.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl">{reward.icon}</div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-600">{reward.pointCost} points</div>
                    {reward.availability === 'limited' && reward.stock !== undefined && (
                      <div className="text-xs text-orange-600">
                        {reward.stock} left
                      </div>
                    )}
                  </div>
                </div>
                
                <h4 className="font-semibold mb-2">{reward.name}</h4>
                <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
                
                {reward.requirements && (
                  <div className="mb-3 text-xs text-gray-500">
                    {reward.requirements.minLevel && (
                      <div>Requires Level {reward.requirements.minLevel}+</div>
                    )}
                  </div>
                )}
                
                <button
                  onClick={() => handleRedeemReward(reward)}
                  disabled={!user || user.availablePoints < reward.pointCost}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    user && user.availablePoints >= reward.pointCost
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {user && user.availablePoints >= reward.pointCost ? 'Redeem' : 'Insufficient Points'}
                </button>
              </div>
            ))}
          </div>
          
          {availableRewards.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🎁</div>
              <p>No rewards available at your current level.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => {
    const userRank = leaderboard.findIndex(entry => entry.userId === userId) + 1;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Leaderboard</h3>
          
          {userRank > 0 && userRank <= 10 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                🎉 You're ranked #{userRank} on the leaderboard!
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div 
                key={entry.userId}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  entry.userId === userId 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    entry.rank === 1 ? 'bg-yellow-500' :
                    entry.rank === 2 ? 'bg-gray-400' :
                    entry.rank === 3 ? 'bg-amber-600' :
                    'bg-gray-500'
                  }`}>
                    {entry.rank === 1 ? '🥇' : 
                     entry.rank === 2 ? '🥈' : 
                     entry.rank === 3 ? '🥉' : 
                     entry.rank}
                  </div>
                  <div>
                    <div className="font-semibold">{entry.username}</div>
                    <div className="text-sm text-gray-600">
                      Level {entry.level} {entry.badge}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">
                    {entry.points.toLocaleString()} points
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {userRank > 10 && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">
                You're currently ranked #{userRank}. Keep engaging to climb higher!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStats = () => {
    if (!userStats) return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Your Statistics</h3>
          
          {/* Points by Category */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">Points by Category</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(userStats.categoryBreakdown).map(([category, points]) => (
                <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="capitalize">{category.replace('-', ' ')}</span>
                  <span className="font-semibold text-blue-600">{(points as number)} points</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Streaks */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">Streaks</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userStats.longestStreaks.map((streak: any) => (
                <div key={streak.type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="capitalize">{streak.type.replace('-', ' ')}</span>
                  <span className="font-semibold text-orange-600">{streak.length} days</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Overall Stats */}
          <div>
            <h4 className="font-medium mb-3">Overall Progress</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{userStats.totalTransactions}</div>
                <div className="text-sm text-gray-600">Total Activities</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{userStats.achievements}</div>
                <div className="text-sm text-gray-600">Achievements</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{userStats.currentStreaks.length}</div>
                <div className="text-sm text-gray-600">Active Streaks</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">🎮</div>
          <p className="text-gray-600">Loading your gamification profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎮 Gamification</h1>
              <p className="text-gray-600">Track your progress and earn rewards</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="font-semibold text-lg">
                  {user.availablePoints.toLocaleString()} 💎
                </div>
                <div className="text-sm text-gray-600">Available Points</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">
                  Level {user.currentLevel} {userStats?.level?.badge}
                </div>
                <div className="text-sm text-gray-600">{userStats?.level?.name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
              { id: 'achievements', label: 'Achievements', icon: '🏆' },
              { id: 'rewards', label: 'Rewards', icon: '🎁' },
              { id: 'leaderboard', label: 'Leaderboard', icon: '🏅' },
              { id: 'stats', label: 'Statistics', icon: '📊' },
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
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'rewards' && renderRewards()}
        {activeTab === 'leaderboard' && renderLeaderboard()}
        {activeTab === 'stats' && renderStats()}
      </div>

      {/* Level Up Animation */}
      {levelUpAnimation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center max-w-md mx-4 animate-bounce">
            <div className="text-6xl mb-4">{levelUpAnimation.levelInfo?.badge || '🎉'}</div>
            <h2 className="text-2xl font-bold text-blue-600 mb-2">Level Up!</h2>
            <p className="text-lg mb-4">
              You've reached Level {levelUpAnimation.level}!
            </p>
            <p className="text-gray-600">
              {levelUpAnimation.levelInfo?.name || 'New Level Achieved'}
            </p>
            <div className="mt-4 text-green-600 font-semibold">
              +25 Bonus Points! 🎁
            </div>
          </div>
        </div>
      )}

      {/* Achievement Popup */}
      {achievementPopup.show && achievementPopup.achievement && (
        <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-40 animate-slide-in-right">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{achievementPopup.achievement.icon}</div>
            <div>
              <h4 className="font-semibold">Achievement Unlocked!</h4>
              <p className="text-sm text-gray-600">{achievementPopup.achievement.name}</p>
              <p className="text-xs text-green-600">+{achievementPopup.achievement.points} points</p>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrRedemption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-4">Reward Redeemed!</h2>
            <div className="mb-4">
              <img 
                src={qrRedemption.qrCode} 
                alt="QR Code" 
                className="mx-auto w-48 h-48 border border-gray-300 rounded-lg"
              />
            </div>
            <p className="text-gray-600 mb-4">
              Show this QR code to redeem your reward. 
              <br />
              Valid until: {qrRedemption.expiresAt.toLocaleDateString()}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  // Download QR code
                  const link = document.createElement('a');
                  link.download = `reward_${qrRedemption.id}.png`;
                  link.href = qrRedemption.qrCode;
                  link.click();
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Download QR Code
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationInterface;
