import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';

export default function Assessment() {
  const { t } = useTranslation('common');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const questions = [
    {
      id: 'q1',
      text: t('phq4_q1', 'Little interest or pleasure in doing things'),
      description: t('phq4_q1_desc', 'Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?')
    },
    {
      id: 'q2', 
      text: t('phq4_q2', 'Feeling down, depressed, or hopeless'),
      description: t('phq4_q2_desc', 'Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?')
    },
    {
      id: 'q3',
      text: t('phq4_q3', 'Feeling nervous, anxious, or on edge'),
      description: t('phq4_q3_desc', 'Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?')
    },
    {
      id: 'q4',
      text: t('phq4_q4', 'Not being able to stop or control worrying'),
      description: t('phq4_q4_desc', 'Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?')
    }
  ];

  const options = [
    { value: 0, label: t('not_at_all', 'Not at all'), color: 'bg-green-100 border-green-300' },
    { value: 1, label: t('several_days', 'Several days'), color: 'bg-yellow-100 border-yellow-300' },
    { value: 2, label: t('more_than_half', 'More than half the days'), color: 'bg-orange-100 border-orange-300' },
    { value: 3, label: t('nearly_every_day', 'Nearly every day'), color: 'bg-red-100 border-red-300' }
  ];

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsComplete(true);
    }
  };

  const calculateResults = () => {
    const total = answers.reduce((sum, answer) => sum + answer, 0);
    const depression = answers[0] + answers[1];
    const anxiety = answers[2] + answers[3];

    let severity = 'minimal';
    if (total >= 9) severity = 'severe';
    else if (total >= 6) severity = 'moderate';
    else if (total >= 3) severity = 'mild';

    return { total, depression, anxiety, severity };
  };

  const restart = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setIsComplete(false);
  };

  if (isComplete) {
    const results = calculateResults();
    
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              {t('assessment_results', 'Your Assessment Results')}
            </h1>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h3 className="font-semibold text-blue-800 mb-2">
                  {t('total_score', 'Total Score')}: {results.total}/12
                </h3>
                <p className="text-blue-700 text-sm">
                  {t('severity_level', 'Severity Level')}: <span className="font-medium">{results.severity}</span>
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-purple-50 border border-purple-200 rounded p-4">
                  <h4 className="font-semibold text-purple-800 mb-1">
                    {t('depression_score', 'Depression Score')}
                  </h4>
                  <p className="text-purple-700">{results.depression}/6</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <h4 className="font-semibold text-green-800 mb-1">
                    {t('anxiety_score', 'Anxiety Score')}
                  </h4>
                  <p className="text-green-700">{results.anxiety}/6</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  {t('recommendations', 'Recommendations')}
                </h4>
                <ul className="text-yellow-700 text-sm space-y-1">
                  {results.severity === 'minimal' && (
                    <>
                      <li>• {t('rec_minimal_1', 'Continue practicing self-care and stress management')}</li>
                      <li>• {t('rec_minimal_2', 'Consider joining peer support groups for ongoing wellness')}</li>
                    </>
                  )}
                  {results.severity === 'mild' && (
                    <>
                      <li>• {t('rec_mild_1', 'Start daily mood tracking to identify patterns')}</li>
                      <li>• {t('rec_mild_2', 'Explore mental health resources and coping strategies')}</li>
                    </>
                  )}
                  {(results.severity === 'moderate' || results.severity === 'severe') && (
                    <>
                      <li>• {t('rec_moderate_1', 'Consider speaking with a mental health professional')}</li>
                      <li>• {t('rec_moderate_2', 'Connect with crisis support resources if needed')}</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="flex space-x-4">
                <button 
                  onClick={restart}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
                >
                  {t('retake_assessment', 'Retake Assessment')}
                </button>
                <Link href="/dashboard" className="flex-1">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                    {t('back_dashboard', 'Back to Dashboard')}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {t('phq4_title', 'PHQ-4 Mental Health Assessment')}
              </h1>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
                {t('back_dashboard', 'Back to Dashboard')}
              </Link>
            </div>
            <p className="text-gray-600 text-sm">
              {t('phq4_intro', 'This brief assessment helps evaluate your mental wellness over the past 2 weeks.')}
            </p>
            
            {/* Progress Bar */}
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('question_progress', 'Question')} {currentQuestion + 1} {t('of', 'of')} {questions.length}
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {questions[currentQuestion].text}
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              {questions[currentQuestion].description}
            </p>

            <div className="space-y-3">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full p-4 border-2 rounded-lg text-left hover:shadow-md transition-shadow ${option.color} hover:opacity-80`}
                >
                  <span className="font-medium">{option.value}. {option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>{t('privacy_reminder', 'Your responses are anonymous and encrypted for your privacy.')}</p>
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
