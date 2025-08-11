import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';

export default function MoodTracking() {
  const { t } = useTranslation('common');
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const moodLevels = [
    { value: 1, label: t('very_bad', 'Very Bad'), color: 'bg-red-500', emoji: '😭' },
    { value: 2, label: t('bad', 'Bad'), color: 'bg-red-400', emoji: '😢' },
    { value: 3, label: t('poor', 'Poor'), color: 'bg-orange-400', emoji: '😞' },
    { value: 4, label: t('below_average', 'Below Average'), color: 'bg-orange-300', emoji: '😔' },
    { value: 5, label: t('neutral', 'Neutral'), color: 'bg-yellow-400', emoji: '😐' },
    { value: 6, label: t('above_average', 'Above Average'), color: 'bg-lime-400', emoji: '🙂' },
    { value: 7, label: t('good', 'Good'), color: 'bg-green-400', emoji: '😊' },
    { value: 8, label: t('very_good', 'Very Good'), color: 'bg-green-500', emoji: '😄' },
    { value: 9, label: t('excellent', 'Excellent'), color: 'bg-blue-400', emoji: '😁' },
    { value: 10, label: t('amazing', 'Amazing'), color: 'bg-purple-500', emoji: '🤩' }
  ];

  const emotionOptions = [
    { id: 'happy', label: t('happy', 'Happy'), emoji: '😊' },
    { id: 'sad', label: t('sad', 'Sad'), emoji: '😢' },
    { id: 'anxious', label: t('anxious', 'Anxious'), emoji: '😰' },
    { id: 'angry', label: t('angry', 'Angry'), emoji: '😠' },
    { id: 'excited', label: t('excited', 'Excited'), emoji: '🤗' },
    { id: 'tired', label: t('tired', 'Tired'), emoji: '😴' },
    { id: 'stressed', label: t('stressed', 'Stressed'), emoji: '😤' },
    { id: 'calm', label: t('calm', 'Calm'), emoji: '😌' },
    { id: 'frustrated', label: t('frustrated', 'Frustrated'), emoji: '😖' },
    { id: 'hopeful', label: t('hopeful', 'Hopeful'), emoji: '🤞' },
    { id: 'lonely', label: t('lonely', 'Lonely'), emoji: '😔' },
    { id: 'grateful', label: t('grateful', 'Grateful'), emoji: '🙏' }
  ];

  const toggleEmotion = (emotionId: string) => {
    setEmotions(prev => 
      prev.includes(emotionId) 
        ? prev.filter(id => id !== emotionId)
        : [...prev, emotionId]
    );
  };

  const handleSubmit = async () => {
    if (moodScore === null) return;

    // Here you would normally send to your API
    console.log('Mood log:', { moodScore, emotions, notes });
    setIsSubmitted(true);
    
    // Reset form after a delay
    setTimeout(() => {
      setMoodScore(null);
      setEmotions([]);
      setNotes('');
      setIsSubmitted(false);
    }, 3000);
  };

  const getMoodColor = (score: number) => {
    const mood = moodLevels.find(m => m.value === score);
    return mood ? mood.color : 'bg-gray-400';
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t('mood_logged', 'Mood Logged!')}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('mood_thanks', 'Thank you for tracking your mood. This helps us understand your wellness patterns.')}
          </p>
          <div className="space-y-3">
            <Link href="/dashboard">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                {t('back_dashboard', 'Back to Dashboard')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {t('daily_mood_tracking', 'Daily Mood Tracking')}
            </h1>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
              {t('back_dashboard', 'Back to Dashboard')}
            </Link>
          </div>

          <div className="space-y-8">
            {/* Mood Score */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t('how_feeling_today', 'How are you feeling today?')}
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                {t('rate_mood_instruction', 'Rate your overall mood on a scale of 1-10')}
              </p>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                {moodLevels.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setMoodScore(mood.value)}
                    className={`p-3 rounded-lg border-2 text-white font-semibold text-sm transition-all ${
                      moodScore === mood.value 
                        ? `${mood.color} border-gray-800 scale-105` 
                        : `${mood.color} border-transparent opacity-70 hover:opacity-100`
                    }`}
                  >
                    <div className="text-lg">{mood.emoji}</div>
                    <div>{mood.value}</div>
                  </button>
                ))}
              </div>
              
              {moodScore && (
                <div className="text-center">
                  <p className="text-gray-600 text-sm">
                    {t('selected_mood', 'Selected mood')}: <span className="font-semibold">
                      {moodLevels.find(m => m.value === moodScore)?.label} ({moodScore}/10)
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Emotions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t('specific_emotions', 'What specific emotions are you experiencing?')}
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                {t('select_multiple_emotions', 'Select all that apply (you can choose multiple)')}
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                {emotionOptions.map((emotion) => (
                  <button
                    key={emotion.id}
                    onClick={() => toggleEmotion(emotion.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm ${
                      emotions.includes(emotion.id)
                        ? 'bg-blue-100 border-blue-500 text-blue-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-lg mb-1">{emotion.emoji}</div>
                    <div>{emotion.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t('additional_notes', 'Additional Notes (Optional)')}
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                {t('notes_instruction', 'Share what influenced your mood today or any thoughts you\'d like to record')}
              </p>
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notes_placeholder', 'e.g., Had a stressful day at work, but felt better after talking to a friend...')}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>

            {/* Submit */}
            <div className="flex space-x-4">
              <button
                onClick={handleSubmit}
                disabled={moodScore === null}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                  moodScore !== null
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {t('log_mood', 'Log My Mood')}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-500">
            <p>{t('mood_privacy', 'Your mood data is stored anonymously and helps identify patterns for better wellness support.')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
