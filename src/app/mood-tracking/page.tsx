'use client';

import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, BarChart3, Smile, Frown, Meh, Brain, Heart, Activity } from 'lucide-react';

interface MoodEntry {
  id: string;
  date: string;
  mood: number; // 1-10 scale
  emotions: string[];
  notes?: string;
  energy: number; // 1-10 scale
  sleep: number; // hours
  activities: string[];
}

const moodEmojis = [
  { value: 1, emoji: '😢', label: 'Very Sad', color: 'text-red-600' },
  { value: 2, emoji: '😞', label: 'Sad', color: 'text-red-500' },
  { value: 3, emoji: '😟', label: 'Down', color: 'text-orange-500' },
  { value: 4, emoji: '😐', label: 'Low', color: 'text-orange-400' },
  { value: 5, emoji: '😑', label: 'Neutral', color: 'text-yellow-500' },
  { value: 6, emoji: '🙂', label: 'Okay', color: 'text-yellow-400' },
  { value: 7, emoji: '😊', label: 'Good', color: 'text-green-400' },
  { value: 8, emoji: '😃', label: 'Great', color: 'text-green-500' },
  { value: 9, emoji: '😄', label: 'Excellent', color: 'text-green-600' },
  { value: 10, emoji: '🤩', label: 'Amazing', color: 'text-green-700' }
];

const emotionOptions = [
  'Happy', 'Sad', 'Anxious', 'Angry', 'Excited', 'Frustrated', 
  'Calm', 'Stressed', 'Content', 'Worried', 'Grateful', 'Lonely'
];

const activityOptions = [
  'Exercise', 'Meditation', 'Reading', 'Work', 'Socializing', 'Gaming',
  'Cooking', 'Music', 'Art', 'Nature', 'Therapy', 'Learning'
];

export default function MoodTrackingPage() {
  const [currentMood, setCurrentMood] = useState<number | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [currentEnergy, setCurrentEnergy] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [view, setView] = useState<'log' | 'insights'>('log');

  // Sample data for demonstration
  useEffect(() => {
    const sampleEntries: MoodEntry[] = [
      {
        id: '1',
        date: '2025-08-11',
        mood: 7,
        emotions: ['Happy', 'Content'],
        energy: 8,
        sleep: 7.5,
        activities: ['Exercise', 'Reading'],
        notes: 'Had a great workout this morning and finished a good book.'
      },
      {
        id: '2',
        date: '2025-08-10',
        mood: 5,
        emotions: ['Anxious', 'Worried'],
        energy: 4,
        sleep: 6,
        activities: ['Work', 'Meditation'],
        notes: 'Stressful day at work, but meditation helped.'
      },
      {
        id: '3',
        date: '2025-08-09',
        mood: 8,
        emotions: ['Excited', 'Grateful'],
        energy: 9,
        sleep: 8,
        activities: ['Socializing', 'Nature'],
        notes: 'Spent time with friends in the park. Beautiful day!'
      }
    ];
    setMoodEntries(sampleEntries);
  }, []);

  const handleEmotionToggle = (emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleActivityToggle = (activity: string) => {
    setSelectedActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const handleSubmit = () => {
    if (currentMood === null) return;

    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      mood: currentMood,
      emotions: selectedEmotions,
      energy: currentEnergy || 5,
      sleep: sleepHours || 8,
      activities: selectedActivities,
      notes: notes.trim()
    };

    setMoodEntries(prev => [newEntry, ...prev]);
    
    // Reset form
    setCurrentMood(null);
    setSelectedEmotions([]);
    setCurrentEnergy(null);
    setSleepHours(null);
    setSelectedActivities([]);
    setNotes('');
  };

  const averageMood = moodEntries.reduce((sum, entry) => sum + entry.mood, 0) / moodEntries.length || 0;
  const weeklyEntries = moodEntries.slice(0, 7);
  const moodTrend = weeklyEntries.length > 1 
    ? weeklyEntries[0].mood > weeklyEntries[weeklyEntries.length - 1].mood ? 'up' : 'down'
    : 'stable';

  const getMoodEmoji = (value: number) => {
    const mood = moodEmojis.find(m => m.value === value);
    return mood ? mood.emoji : '😐';
  };

  const getMoodColor = (value: number) => {
    if (value <= 3) return 'text-red-500';
    if (value <= 5) return 'text-orange-500';
    if (value <= 7) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mood Tracking</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Track your daily mood, emotions, and activities to identify patterns and improve your mental wellbeing.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setView('log')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                view === 'log' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Log Mood
            </button>
            <button
              onClick={() => setView('insights')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                view === 'insights' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              View Insights
            </button>
          </div>
        </div>

        {view === 'log' ? (
          /* Mood Logging Form */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How are you feeling today?</h2>
              
              {/* Mood Scale */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">Overall Mood (1-10)</label>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {moodEmojis.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setCurrentMood(mood.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        currentMood === mood.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{mood.emoji}</div>
                      <div className="text-xs font-medium">{mood.value}</div>
                    </button>
                  ))}
                </div>
                {currentMood && (
                  <p className="text-center mt-2 text-gray-600">
                    You selected: <span className="font-semibold">{moodEmojis.find(m => m.value === currentMood)?.label}</span>
                  </p>
                )}
              </div>

              {/* Emotions */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">What emotions are you experiencing?</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {emotionOptions.map((emotion) => (
                    <button
                      key={emotion}
                      onClick={() => handleEmotionToggle(emotion)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        selectedEmotions.includes(emotion)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {emotion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Level */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">Energy Level (1-10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentEnergy || 5}
                  onChange={(e) => setCurrentEnergy(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Low</span>
                  <span className="font-medium">{currentEnergy || 5}</span>
                  <span>High</span>
                </div>
              </div>

              {/* Sleep Hours */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">Hours of Sleep</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={sleepHours || ''}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  placeholder="8"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Activities */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">Activities Today</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {activityOptions.map((activity) => (
                    <button
                      key={activity}
                      onClick={() => handleActivityToggle(activity)}
                      className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                        selectedActivities.includes(activity)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {activity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything else you'd like to remember about today?"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={currentMood === null}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Save Entry
              </button>
            </div>
          </div>
        ) : (
          /* Insights View */
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Average Mood</h3>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {averageMood.toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">Last 7 days</p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Mood Trend</h3>
                <div className={`text-3xl font-bold mb-1 ${moodTrend === 'up' ? 'text-green-600' : moodTrend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                  {moodTrend === 'up' ? '↗' : moodTrend === 'down' ? '↘' : '→'}
                </div>
                <p className="text-sm text-gray-600 capitalize">{moodTrend}</p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="bg-purple-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Entries</h3>
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {moodEntries.length}
                </div>
                <p className="text-sm text-gray-600">Total logged</p>
              </div>
            </div>

            {/* Recent Entries */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Entries</h2>
              <div className="space-y-4">
                {moodEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getMoodEmoji(entry.mood)}</div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                          <div className={`text-sm font-medium ${getMoodColor(entry.mood)}`}>
                            Mood: {entry.mood}/10
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Energy: {entry.energy}/10 • Sleep: {entry.sleep}h
                      </div>
                    </div>
                    
                    {entry.emotions.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-700">Emotions: </span>
                        <span className="text-sm text-gray-600">{entry.emotions.join(', ')}</span>
                      </div>
                    )}
                    
                    {entry.activities.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-700">Activities: </span>
                        <span className="text-sm text-gray-600">{entry.activities.join(', ')}</span>
                      </div>
                    )}
                    
                    {entry.notes && (
                      <div className="bg-gray-50 rounded p-3 mt-3">
                        <p className="text-sm text-gray-700">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Insights</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Patterns Detected</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Higher mood on days with exercise</li>
                    <li>• Energy levels correlate with sleep quality</li>
                    <li>• Social activities boost overall wellbeing</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Recommendations</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Maintain 7-8 hours of sleep</li>
                    <li>• Continue regular exercise routine</li>
                    <li>• Consider mindfulness on low-mood days</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
