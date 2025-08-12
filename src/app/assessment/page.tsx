'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: string;
  text: string;
  type: 'scale' | 'choice';
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
}

const questions: Question[] = [
  {
    id: 'q1',
    text: 'Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?',
    type: 'choice',
    options: [
      'Not at all',
      'Several days',
      'More than half the days',
      'Nearly every day'
    ]
  },
  {
    id: 'q2',
    text: 'Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?',
    type: 'choice',
    options: [
      'Not at all',
      'Several days',
      'More than half the days',
      'Nearly every day'
    ]
  },
  {
    id: 'q3',
    text: 'Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?',
    type: 'choice',
    options: [
      'Not at all',
      'Several days',
      'More than half the days',
      'Nearly every day'
    ]
  },
  {
    id: 'q4',
    text: 'Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?',
    type: 'choice',
    options: [
      'Not at all',
      'Several days',
      'More than half the days',
      'Nearly every day'
    ]
  }
];

export default function AssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAnswer = (answer: string | number) => {
    const questionId = questions[currentQuestion].id;
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Calculate results
      calculateResults();
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateResults = () => {
    // Simple PHQ-4 scoring
    const scores = Object.values(answers).map((answer, index) => {
      if (typeof answer === 'string') {
        const options = questions[index].options!;
        return options.indexOf(answer);
      }
      return answer as number;
    });

    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const anxietyScore = scores[0] + scores[1]; // First 2 questions
    const depressionScore = scores[2] + scores[3]; // Last 2 questions

    let severityLevel = 'Minimal';
    let recommendation = '';
    let color = 'green';

    if (totalScore <= 2) {
      severityLevel = 'Minimal';
      recommendation = 'Your responses suggest minimal symptoms. Continue practicing self-care and maintaining healthy habits.';
      color = 'green';
    } else if (totalScore <= 5) {
      severityLevel = 'Mild';
      recommendation = 'Your responses suggest mild symptoms. Consider incorporating stress management techniques and monitoring your wellbeing.';
      color = 'yellow';
    } else if (totalScore <= 8) {
      severityLevel = 'Moderate';
      recommendation = 'Your responses suggest moderate symptoms. Consider speaking with a mental health professional for support.';
      color = 'orange';
    } else {
      severityLevel = 'Severe';
      recommendation = 'Your responses suggest more significant symptoms. We strongly recommend speaking with a mental health professional soon.';
      color = 'red';
    }

    setResults({
      totalScore,
      anxietyScore,
      depressionScore,
      severityLevel,
      recommendation,
      color
    });
  };

  const currentAnswered = questions[currentQuestion].id in answers;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (isCompleted && results) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete</h1>
              <p className="text-gray-600">Thank you for completing the PHQ-4 assessment</p>
            </div>

            <div className="space-y-6">
              <div className={`border-l-4 border-${results.color}-500 bg-${results.color}-50 p-4 rounded-r-lg`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Overall Result</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${results.color}-100 text-${results.color}-800`}>
                    {results.severityLevel}
                  </span>
                </div>
                <p className="text-gray-700">{results.recommendation}</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.totalScore}/12</div>
                  <div className="text-sm text-gray-600">Total Score</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{results.anxietyScore}/6</div>
                  <div className="text-sm text-gray-600">Anxiety</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600">{results.depressionScore}/6</div>
                  <div className="text-sm text-gray-600">Depression</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Your responses are completely anonymous and private</li>
                  <li>• Consider retaking this assessment in 2 weeks to track changes</li>
                  <li>• Explore our resources and chat support for additional help</li>
                  {results.totalScore > 5 && (
                    <li className="text-orange-600 font-medium">• Consider speaking with a mental health professional</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <Link 
                href="/chat"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium text-center transition-colors"
              >
                Start Chat Support
              </Link>
              <Link 
                href="/resources"
                className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 py-3 px-6 rounded-lg font-medium text-center transition-colors"
              >
                View Resources
              </Link>
            </div>

            <div className="mt-6 text-center">
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Mental Health Assessment</h1>
                <p className="text-sm text-gray-600">PHQ-4 Screening Tool</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {currentQuestion + 1} of {questions.length}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">
              {questions[currentQuestion].text}
            </h2>
            
            <div className="space-y-3">
              {questions[currentQuestion].options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    answers[questions[currentQuestion].id] === option
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      answers[questions[currentQuestion].id] === option
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[questions[currentQuestion].id] === option && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={!currentAnswered}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {currentQuestion === questions.length - 1 ? 'Complete' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
          <p className="text-sm text-green-800">
            <strong>Privacy Protected:</strong> Your responses are completely anonymous and encrypted. 
            This assessment is for screening purposes only and is not a substitute for professional diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}
