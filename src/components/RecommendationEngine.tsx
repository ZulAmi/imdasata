import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import AIRecommendationEngine, { 
  UserProfile, 
  Recommendation, 
  RecommendationRequest,
  MentalHealthResource 
} from '../lib/ai-recommendation-engine';
import mentalHealthResources from '../lib/mental-health-resources';

interface RecommendationEngineProps {
  userProfile: UserProfile;
  trigger?: 'assessment_complete' | 'resource_view' | 'crisis_detected' | 'routine_check' | 'user_request';
  maxRecommendations?: number;
}

const RecommendationEngineComponent: React.FC<RecommendationEngineProps> = ({
  userProfile,
  trigger = 'user_request',
  maxRecommendations = 5
}) => {
  const { t } = useTranslation('common');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [engine] = useState(() => new AIRecommendationEngine());
  const [selectedFilters, setSelectedFilters] = useState({
    resourceTypes: [] as string[],
    urgencyLevel: 'all' as string,
    maxDistance: 50 // km
  });
  const [abTestGroup, setAbTestGroup] = useState<string>('');

  // Initialize A/B test group assignment
  useEffect(() => {
    const groups = ['control', 'ml_enhanced', 'cultural_first', 'collaborative_heavy'];
    const randomGroup = groups[Math.floor(Math.random() * groups.length)];
    setAbTestGroup(randomGroup);
  }, []);

  // Load recommendations
  useEffect(() => {
    loadRecommendations();
  }, [userProfile, selectedFilters, abTestGroup]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add resources to engine
      mentalHealthResources.forEach(resource => {
        // engine.addResource(resource); // Would implement this method
      });

      const request: RecommendationRequest = {
        userProfile,
        context: {
          trigger,
          maxRecommendations,
          includeTypes: selectedFilters.resourceTypes.length > 0 ? selectedFilters.resourceTypes : undefined,
          urgencyFilter: selectedFilters.urgencyLevel !== 'all' ? selectedFilters.urgencyLevel : undefined
        },
        abTestGroup
      };

      const recs = await engine.getRecommendations(request);
      setRecommendations(recs);
    } catch (err) {
      setError('Failed to load recommendations. Please try again.');
      console.error('Recommendation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResourceClick = (recommendation: Recommendation) => {
    // Track interaction
    const recommendationId = `rec_${recommendation.resource.id}_${Date.now()}`;
    engine.trackInteraction(recommendationId, 'click', {
      timeToClick: Date.now() - performance.now()
    });

    // Open resource
    if (recommendation.resource.content?.url) {
      window.open(recommendation.resource.content.url, '_blank');
    }
  };

  const handleResourceRating = (recommendation: Recommendation, rating: number, helpfulness: number) => {
    const recommendationId = `rec_${recommendation.resource.id}_${Date.now()}`;
    engine.trackInteraction(recommendationId, 'rate', {
      rating,
      helpfulness
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'crisis': return '🚨';
      case 'therapy': return '🧠';
      case 'self-help': return '📚';
      case 'peer-support': return '👥';
      case 'wellness': return '🧘';
      case 'educational': return '🎓';
      default: return '💡';
    }
  };

  const formatLanguages = (languages: string[]) => {
    const langNames: { [key: string]: string } = {
      'en': 'English',
      'zh': 'Chinese',
      'bn': 'Bengali',
      'ta': 'Tamil',
      'my': 'Malay',
      'idn': 'Indonesian'
    };
    return languages.map(lang => langNames[lang] || lang).join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-xl mb-2">⚠️</div>
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Recommendations</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadRecommendations}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎯 Personalized Mental Health Recommendations
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            AI-powered recommendations tailored to your needs, background, and preferences. 
            Our system learns from your interactions to provide increasingly relevant suggestions.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Test Group: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{abTestGroup}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filter Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Resource Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resource Types
              </label>
              <div className="space-y-2">
                {['crisis', 'therapy', 'self-help', 'peer-support', 'wellness', 'educational'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.resourceTypes.includes(type)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...selectedFilters.resourceTypes, type]
                          : selectedFilters.resourceTypes.filter(t => t !== type);
                        setSelectedFilters({ ...selectedFilters, resourceTypes: newTypes });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{getResourceTypeIcon(type)} {type.replace('-', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Urgency Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Urgency
              </label>
              <select
                value={selectedFilters.urgencyLevel}
                onChange={(e) => setSelectedFilters({ ...selectedFilters, urgencyLevel: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Levels</option>
                <option value="low">Low & Above</option>
                <option value="medium">Medium & Above</option>
                <option value="high">High & Above</option>
                <option value="urgent">Urgent Only</option>
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={loadRecommendations}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Refresh Recommendations
              </button>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-6">
          {recommendations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Recommendations Found</h3>
              <p className="text-gray-500">
                Try adjusting your filters or check back later as we add more resources.
              </p>
            </div>
          ) : (
            recommendations.map((recommendation, index) => (
              <RecommendationCard
                key={`${recommendation.resource.id}_${index}`}
                recommendation={recommendation}
                position={index + 1}
                onResourceClick={handleResourceClick}
                onRating={handleResourceRating}
                formatLanguages={formatLanguages}
                getUrgencyColor={getUrgencyColor}
                getResourceTypeIcon={getResourceTypeIcon}
              />
            ))
          )}
        </div>

        {/* Analytics Note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-700 text-sm">
            💡 Your interactions help us improve recommendations for you and other users. 
            All data is processed anonymously to protect your privacy.
          </p>
        </div>
      </div>
    </div>
  );
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  position: number;
  onResourceClick: (recommendation: Recommendation) => void;
  onRating: (recommendation: Recommendation, rating: number, helpfulness: number) => void;
  formatLanguages: (languages: string[]) => string;
  getUrgencyColor: (urgency: string) => string;
  getResourceTypeIcon: (type: string) => string;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  position,
  onResourceClick,
  onRating,
  formatLanguages,
  getUrgencyColor,
  getResourceTypeIcon
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [helpfulnessRating, setHelpfulnessRating] = useState<number | null>(null);

  const { resource, score, reasons, strategy, urgency, personalizedMessage } = recommendation;

  const handleRatingSubmit = () => {
    if (userRating && helpfulnessRating) {
      onRating(recommendation, userRating, helpfulnessRating);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getResourceTypeIcon(resource.type)}</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{resource.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(urgency)}`}>
                    {urgency.toUpperCase()}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    #{position}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {strategy}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mb-3">{resource.description}</p>
            
            {personalizedMessage && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                <p className="text-blue-800 text-sm italic">💬 {personalizedMessage}</p>
              </div>
            )}
          </div>
          
          <div className="text-right ml-4">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(score * 100)}%
            </div>
            <div className="text-xs text-gray-500">Match Score</div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Languages:</span>
            <div className="text-gray-600">{formatLanguages(resource.metadata.languages)}</div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Duration:</span>
            <div className="text-gray-600">{resource.metadata.duration} min</div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Cost:</span>
            <div className="text-gray-600 capitalize">{resource.availability.cost}</div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Rating:</span>
            <div className="text-gray-600">
              ⭐ {resource.effectiveness.averageRating.toFixed(1)} 
              ({resource.effectiveness.totalRatings})
            </div>
          </div>
        </div>

        {/* Reasons */}
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Why this recommendation:</div>
          <div className="flex flex-wrap gap-2">
            {reasons.map((reason, index) => (
              <span 
                key={index}
                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full"
              >
                ✓ {reason}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => onResourceClick(recommendation)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            🔗 Access Resource
          </button>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {/* Quick Rating */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rate:</span>
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              onClick={() => setUserRating(rating)}
              className={`text-lg ${userRating && rating <= userRating ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Provider Information */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Provider Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Organization:</span> {resource.provider.name}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {resource.provider.type}
                </div>
                <div>
                  <span className="font-medium">Credentials:</span> {resource.provider.credentials.join(', ')}
                </div>
                {resource.provider.contact && (
                  <div className="mt-3">
                    <div className="font-medium mb-1">Contact:</div>
                    <div className="space-y-1">
                      {resource.provider.contact.phone && (
                        <div>📞 {resource.provider.contact.phone}</div>
                      )}
                      {resource.provider.contact.email && (
                        <div>📧 {resource.provider.contact.email}</div>
                      )}
                      {resource.provider.contact.whatsapp && (
                        <div>💬 {resource.provider.contact.whatsapp}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Availability & Effectiveness */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Availability & Effectiveness</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Locations:</span> {resource.availability.locations.join(', ')}
                </div>
                <div>
                  <span className="font-medium">Wait Time:</span> {resource.availability.waitTime || 0} days
                </div>
                <div>
                  <span className="font-medium">Completion Rate:</span> {Math.round(resource.effectiveness.completionRate * 100)}%
                </div>
                <div>
                  <span className="font-medium">Improvement Score:</span> {resource.effectiveness.improvementScore.toFixed(1)}/12
                </div>
                {resource.availability.accessRequirements.length > 0 && (
                  <div>
                    <span className="font-medium">Requirements:</span> {resource.availability.accessRequirements.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Preview */}
          {resource.content && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-3">Content Overview</h4>
              {resource.content.text && (
                <p className="text-sm text-gray-600 mb-3">{resource.content.text}</p>
              )}
              {resource.content.steps && (
                <div>
                  <div className="font-medium text-sm mb-2">What you'll learn:</div>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    {resource.content.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Rating Section */}
          <div className="mt-6 pt-4 border-t border-gray-300">
            <h4 className="font-semibold text-gray-800 mb-3">Rate This Recommendation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setUserRating(rating)}
                      className={`text-2xl ${userRating && rating <= userRating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How helpful was this recommendation?
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setHelpfulnessRating(rating)}
                      className={`text-2xl ${helpfulnessRating && rating <= helpfulnessRating ? 'text-green-400' : 'text-gray-300'}`}
                    >
                      👍
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {userRating && helpfulnessRating && (
              <button
                onClick={handleRatingSubmit}
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit Rating
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationEngineComponent;
