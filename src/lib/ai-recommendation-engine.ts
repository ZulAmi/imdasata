import { PHQ4AnalyticsData } from './phq4-analytics';

// Types for the recommendation engine
export interface UserProfile {
  anonymousId: string;
  phq4Scores: {
    latest: PHQ4Score;
    history: PHQ4Score[];
  };
  demographics: {
    countryOfOrigin?: string;
    ageGroup?: string;
    gender?: string;
    employmentSector?: string;
    language: string;
    location?: {
      country: string;
      city?: string;
      coordinates?: [number, number]; // [lat, lng]
    };
  };
  usagePatterns: {
    assessmentFrequency: number; // times per month
    preferredTime: string; // hour of day
    sessionDuration: number; // average minutes
    featuresUsed: string[];
    lastActive: string;
    totalSessions: number;
  };
  preferences: {
    culturalPreferences: string[];
    communicationStyle: 'direct' | 'supportive' | 'clinical' | 'peer-based';
    resourceTypes: ('therapy' | 'self-help' | 'peer-support' | 'medication' | 'crisis' | 'wellness')[];
    privacyLevel: 'minimal' | 'moderate' | 'high';
  };
  interactionHistory: UserInteraction[];
}

export interface PHQ4Score {
  totalScore: number;
  depressionScore: number;
  anxietyScore: number;
  riskLevel: 'minimal' | 'mild' | 'moderate' | 'severe';
  timestamp: string;
}

export interface UserInteraction {
  type: 'view' | 'click' | 'complete' | 'share' | 'rate' | 'bookmark';
  resourceId: string;
  timestamp: string;
  rating?: number; // 1-5
  duration?: number; // seconds
  completed?: boolean;
  metadata?: any;
}

export interface MentalHealthResource {
  id: string;
  type: 'therapy' | 'self-help' | 'peer-support' | 'medication' | 'crisis' | 'wellness' | 'educational';
  title: string;
  description: string;
  content?: {
    url?: string;
    text?: string;
    videoUrl?: string;
    audioUrl?: string;
    steps?: string[];
  };
  metadata: {
    languages: string[];
    culturalContext: string[];
    targetDemographics: {
      ageGroups?: string[];
      genders?: string[];
      employmentSectors?: string[];
      countries?: string[];
    };
    riskLevels: ('minimal' | 'mild' | 'moderate' | 'severe')[];
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number; // minutes
    format: 'text' | 'video' | 'audio' | 'interactive' | 'group' | 'individual';
  };
  effectiveness: {
    averageRating: number;
    totalRatings: number;
    completionRate: number;
    improvementScore: number; // change in PHQ-4 scores after engagement
  };
  availability: {
    locations: string[]; // countries/cities where available
    cost: 'free' | 'low' | 'medium' | 'high';
    accessRequirements: string[];
    waitTime?: number; // days
  };
  provider: {
    name: string;
    type: 'government' | 'ngo' | 'private' | 'community' | 'peer';
    credentials: string[];
    contact?: {
      phone?: string;
      email?: string;
      website?: string;
      whatsapp?: string;
    };
  };
}

export interface Recommendation {
  resource: MentalHealthResource;
  score: number; // 0-1 confidence score
  reasons: string[];
  strategy: 'content-based' | 'collaborative' | 'demographic' | 'hybrid' | 'ml-predicted';
  personalizedMessage?: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHelpfulness: number; // 0-1
}

export interface RecommendationRequest {
  userProfile: UserProfile;
  context: {
    trigger: 'assessment_complete' | 'resource_view' | 'crisis_detected' | 'routine_check' | 'user_request';
    maxRecommendations: number;
    includeTypes?: string[];
    excludeTypes?: string[];
    urgencyFilter?: string;
  };
  abTestGroup?: string;
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  active: boolean;
  trafficSplit: { [strategy: string]: number }; // percentage allocation
  startDate: string;
  endDate?: string;
  metrics: string[];
  variants: {
    [variant: string]: {
      strategy: string;
      weights: { [factor: string]: number };
      parameters: any;
    };
  };
}

export interface RecommendationMetrics {
  recommendationId: string;
  userId: string;
  timestamp: string;
  strategy: string;
  abTestGroup?: string;
  resourceId: string;
  score: number;
  position: number; // rank in recommendations
  
  // Interaction metrics
  viewed: boolean;
  clicked: boolean;
  completed: boolean;
  timeToClick?: number; // seconds
  engagementDuration?: number; // seconds
  rating?: number;
  
  // Effectiveness metrics
  helpfulnessRating?: number;
  followUpAssessmentScore?: number;
  scoreImprovement?: number;
  
  // Context
  triggerContext: string;
  userRiskLevel: string;
  deviceType?: string;
  timeOfDay: string;
}

export class AIRecommendationEngine {
  private resources: MentalHealthResource[] = [];
  private userProfiles: Map<string, UserProfile> = new Map();
  private interactions: UserInteraction[] = [];
  private abTests: Map<string, ABTestConfig> = new Map();
  private metrics: RecommendationMetrics[] = [];
  
  // ML model weights (simplified - in production, these would be learned)
  private modelWeights = {
    phq4ScoreWeight: 0.25,
    demographicWeight: 0.20,
    culturalWeight: 0.15,
    collaborativeWeight: 0.20,
    usagePatternWeight: 0.10,
    recencyWeight: 0.10
  };

  constructor() {
    this.initializeResources();
    this.initializeABTests();
  }

  /**
   * Main recommendation function
   */
  async getRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    const { userProfile, context, abTestGroup } = request;
    
    // Determine strategy based on A/B test
    const strategy = this.getRecommendationStrategy(userProfile, abTestGroup);
    
    // Get recommendations using the selected strategy
    let recommendations: Recommendation[] = [];
    
    switch (strategy) {
      case 'content-based':
        recommendations = await this.getContentBasedRecommendations(userProfile, context);
        break;
      case 'collaborative':
        recommendations = await this.getCollaborativeRecommendations(userProfile, context);
        break;
      case 'demographic':
        recommendations = await this.getDemographicRecommendations(userProfile, context);
        break;
      case 'ml-predicted':
        recommendations = await this.getMLPredictedRecommendations(userProfile, context);
        break;
      case 'hybrid':
      default:
        recommendations = await this.getHybridRecommendations(userProfile, context);
        break;
    }

    // Apply context filters
    recommendations = this.applyContextFilters(recommendations, context);
    
    // Rank and limit results
    recommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, context.maxRecommendations);

    // Add personalized messages
    recommendations = this.addPersonalizedMessages(recommendations, userProfile);

    // Log metrics
    this.logRecommendationMetrics(recommendations, userProfile, strategy, abTestGroup);

    return recommendations;
  }

  /**
   * Content-based filtering
   */
  private async getContentBasedRecommendations(
    userProfile: UserProfile, 
    context: any
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const latestScore = userProfile.phq4Scores.latest;

    for (const resource of this.resources) {
      let score = 0;
      const reasons: string[] = [];

      // Risk level matching
      if (resource.metadata.riskLevels.includes(latestScore.riskLevel)) {
        score += 0.3;
        reasons.push(`Suitable for ${latestScore.riskLevel} risk level`);
      }

      // Language matching
      if (resource.metadata.languages.includes(userProfile.demographics.language)) {
        score += 0.2;
        reasons.push(`Available in ${userProfile.demographics.language}`);
      }

      // Cultural context matching
      const userCulture = userProfile.demographics.countryOfOrigin;
      if (userCulture && resource.metadata.culturalContext.includes(userCulture)) {
        score += 0.15;
        reasons.push(`Culturally appropriate for ${userCulture}`);
      }

      // Demographic matching
      const demographics = resource.metadata.targetDemographics;
      if (demographics.ageGroups?.includes(userProfile.demographics.ageGroup || '')) {
        score += 0.1;
        reasons.push('Age-appropriate content');
      }

      if (demographics.employmentSectors?.includes(userProfile.demographics.employmentSector || '')) {
        score += 0.1;
        reasons.push('Relevant to your work situation');
      }

      // Location availability
      const userLocation = userProfile.demographics.location?.country;
      if (userLocation && resource.availability.locations.includes(userLocation)) {
        score += 0.15;
        reasons.push('Available in your location');
      }

      if (score > 0.3) { // Minimum threshold
        recommendations.push({
          resource,
          score,
          reasons,
          strategy: 'content-based',
          urgency: this.calculateUrgency(latestScore.riskLevel, resource.type),
          estimatedHelpfulness: this.estimateHelpfulness(resource, userProfile)
        });
      }
    }

    return recommendations;
  }

  /**
   * Collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(
    userProfile: UserProfile, 
    context: any
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const similarUsers = this.findSimilarUsers(userProfile);

    // Get resources highly rated by similar users
    const resourceScores = new Map<string, { score: number; count: number; reasons: Set<string> }>();

    for (const similarUser of similarUsers) {
      const similarity = similarUser.similarity;
      
      for (const interaction of similarUser.profile.interactionHistory) {
        if (interaction.type === 'rate' && interaction.rating && interaction.rating >= 4) {
          const current = resourceScores.get(interaction.resourceId) || { score: 0, count: 0, reasons: new Set() };
          current.score += similarity * (interaction.rating / 5);
          current.count += 1;
          current.reasons.add(`Highly rated by users with similar background`);
          resourceScores.set(interaction.resourceId, current);
        }
      }
    }

    // Convert to recommendations
    for (const [resourceId, data] of resourceScores.entries()) {
      const resource = this.resources.find(r => r.id === resourceId);
      if (resource && data.count >= 3) { // Minimum interactions threshold
        const avgScore = data.score / data.count;
        
        recommendations.push({
          resource,
          score: avgScore,
          reasons: Array.from(data.reasons),
          strategy: 'collaborative',
          urgency: this.calculateUrgency(userProfile.phq4Scores.latest.riskLevel, resource.type),
          estimatedHelpfulness: avgScore
        });
      }
    }

    return recommendations;
  }

  /**
   * Demographic-based recommendations
   */
  private async getDemographicRecommendations(
    userProfile: UserProfile, 
    context: any
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const userDemographics = userProfile.demographics;

    for (const resource of this.resources) {
      let score = 0;
      const reasons: string[] = [];

      // Country-specific resources
      if (userDemographics.countryOfOrigin && 
          resource.metadata.targetDemographics.countries?.includes(userDemographics.countryOfOrigin)) {
        score += 0.3;
        reasons.push(`Designed for ${userDemographics.countryOfOrigin} nationals`);
      }

      // Employment sector specific
      if (userDemographics.employmentSector && 
          resource.metadata.targetDemographics.employmentSectors?.includes(userDemographics.employmentSector)) {
        score += 0.25;
        reasons.push(`Tailored for ${userDemographics.employmentSector} workers`);
      }

      // Age group matching
      if (userDemographics.ageGroup && 
          resource.metadata.targetDemographics.ageGroups?.includes(userDemographics.ageGroup)) {
        score += 0.2;
        reasons.push(`Appropriate for your age group`);
      }

      // Gender considerations
      if (userDemographics.gender && 
          resource.metadata.targetDemographics.genders?.includes(userDemographics.gender)) {
        score += 0.15;
        reasons.push('Gender-specific content');
      }

      // Language matching
      if (resource.metadata.languages.includes(userDemographics.language)) {
        score += 0.1;
        reasons.push(`Available in ${userDemographics.language}`);
      }

      if (score > 0.4) { // Higher threshold for demographic matching
        recommendations.push({
          resource,
          score,
          reasons,
          strategy: 'demographic',
          urgency: this.calculateUrgency(userProfile.phq4Scores.latest.riskLevel, resource.type),
          estimatedHelpfulness: this.estimateHelpfulness(resource, userProfile)
        });
      }
    }

    return recommendations;
  }

  /**
   * ML-predicted recommendations (simplified ML model)
   */
  private async getMLPredictedRecommendations(
    userProfile: UserProfile, 
    context: any
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const features = this.extractUserFeatures(userProfile);

    for (const resource of this.resources) {
      const resourceFeatures = this.extractResourceFeatures(resource);
      
      // Simplified neural network prediction
      const prediction = this.predictResourceFit(features, resourceFeatures);
      
      if (prediction.score > 0.5) {
        recommendations.push({
          resource,
          score: prediction.score,
          reasons: prediction.reasons,
          strategy: 'ml-predicted',
          urgency: this.calculateUrgency(userProfile.phq4Scores.latest.riskLevel, resource.type),
          estimatedHelpfulness: prediction.score
        });
      }
    }

    return recommendations;
  }

  /**
   * Hybrid approach combining multiple strategies
   */
  private async getHybridRecommendations(
    userProfile: UserProfile, 
    context: any
  ): Promise<Recommendation[]> {
    const contentBased = await this.getContentBasedRecommendations(userProfile, context);
    const collaborative = await this.getCollaborativeRecommendations(userProfile, context);
    const demographic = await this.getDemographicRecommendations(userProfile, context);
    const mlPredicted = await this.getMLPredictedRecommendations(userProfile, context);

    // Combine and weight different strategies
    const combinedScores = new Map<string, {
      resource: MentalHealthResource;
      scores: { [strategy: string]: number };
      reasons: Set<string>;
    }>();

    // Collect all recommendations
    const allRecommendations = [
      ...contentBased.map(r => ({ ...r, strategy: 'content-based' })),
      ...collaborative.map(r => ({ ...r, strategy: 'collaborative' })),
      ...demographic.map(r => ({ ...r, strategy: 'demographic' })),
      ...mlPredicted.map(r => ({ ...r, strategy: 'ml-predicted' }))
    ];

    for (const rec of allRecommendations) {
      const id = rec.resource.id;
      const current = combinedScores.get(id) || {
        resource: rec.resource,
        scores: {},
        reasons: new Set()
      };

      current.scores[rec.strategy] = rec.score;
      rec.reasons.forEach(reason => current.reasons.add(reason));
      combinedScores.set(id, current);
    }

    // Calculate weighted final scores
    const finalRecommendations: Recommendation[] = [];
    const weights = {
      'content-based': 0.3,
      'collaborative': 0.25,
      'demographic': 0.2,
      'ml-predicted': 0.25
    };

    for (const [_, data] of combinedScores.entries()) {
      let finalScore = 0;
      let weightSum = 0;

      for (const [strategy, score] of Object.entries(data.scores)) {
        const weight = weights[strategy as keyof typeof weights] || 0;
        finalScore += score * weight;
        weightSum += weight;
      }

      if (weightSum > 0) {
        finalScore = finalScore / weightSum;
        
        finalRecommendations.push({
          resource: data.resource,
          score: finalScore,
          reasons: Array.from(data.reasons),
          strategy: 'hybrid',
          urgency: this.calculateUrgency(userProfile.phq4Scores.latest.riskLevel, data.resource.type),
          estimatedHelpfulness: finalScore
        });
      }
    }

    return finalRecommendations;
  }

  /**
   * Find users with similar profiles for collaborative filtering
   */
  private findSimilarUsers(userProfile: UserProfile): { profile: UserProfile; similarity: number }[] {
    const similarities: { profile: UserProfile; similarity: number }[] = [];

    for (const [_, otherProfile] of this.userProfiles.entries()) {
      if (otherProfile.anonymousId === userProfile.anonymousId) continue;

      const similarity = this.calculateUserSimilarity(userProfile, otherProfile);
      if (similarity > 0.3) { // Minimum similarity threshold
        similarities.push({ profile: otherProfile, similarity });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 20); // Top 20 similar users
  }

  /**
   * Calculate similarity between two users
   */
  private calculateUserSimilarity(user1: UserProfile, user2: UserProfile): number {
    let similarity = 0;

    // PHQ-4 score similarity
    const scoreDiff = Math.abs(user1.phq4Scores.latest.totalScore - user2.phq4Scores.latest.totalScore);
    const scoreMax = 12;
    similarity += (1 - scoreDiff / scoreMax) * 0.3;

    // Demographic similarity
    if (user1.demographics.countryOfOrigin === user2.demographics.countryOfOrigin) similarity += 0.2;
    if (user1.demographics.ageGroup === user2.demographics.ageGroup) similarity += 0.15;
    if (user1.demographics.employmentSector === user2.demographics.employmentSector) similarity += 0.15;
    if (user1.demographics.language === user2.demographics.language) similarity += 0.1;
    if (user1.demographics.gender === user2.demographics.gender) similarity += 0.1;

    return Math.min(similarity, 1.0);
  }

  /**
   * Extract features for ML model
   */
  private extractUserFeatures(userProfile: UserProfile): number[] {
    return [
      userProfile.phq4Scores.latest.totalScore / 12, // Normalized PHQ-4 score
      userProfile.phq4Scores.latest.depressionScore / 6, // Normalized depression score
      userProfile.phq4Scores.latest.anxietyScore / 6, // Normalized anxiety score
      userProfile.usagePatterns.assessmentFrequency / 10, // Normalized frequency
      userProfile.usagePatterns.totalSessions / 100, // Normalized session count
      userProfile.usagePatterns.sessionDuration / 60, // Normalized duration
      this.encodeRiskLevel(userProfile.phq4Scores.latest.riskLevel),
      this.encodeCategory(userProfile.demographics.ageGroup || '', ['18-25', '26-35', '36-45', '46-55', '55+']),
      this.encodeCategory(userProfile.demographics.countryOfOrigin || '', ['Bangladesh', 'India', 'Philippines', 'Indonesia', 'Myanmar']),
      // Add more features as needed
    ];
  }

  private extractResourceFeatures(resource: MentalHealthResource): number[] {
    return [
      resource.effectiveness.averageRating / 5, // Normalized rating
      resource.effectiveness.completionRate, // Already normalized
      resource.effectiveness.improvementScore / 12, // Normalized improvement
      resource.metadata.duration / 120, // Normalized duration (assuming max 2 hours)
      this.encodeCategory(resource.metadata.difficulty, ['beginner', 'intermediate', 'advanced']),
      this.encodeCategory(resource.type, ['therapy', 'self-help', 'peer-support', 'medication', 'crisis', 'wellness']),
      // Add more features as needed
    ];
  }

  /**
   * Simplified ML prediction model
   */
  private predictResourceFit(userFeatures: number[], resourceFeatures: number[]): { score: number; reasons: string[] } {
    // Simplified prediction logic - in production, use actual ML model
    let score = 0;
    const reasons: string[] = [];

    // Risk level matching
    const userRisk = userFeatures[3]; // Encoded risk level
    if (userRisk > 0.7 && resourceFeatures[5] > 0.8) { // High risk + crisis resources
      score += 0.4;
      reasons.push('Matched based on urgency indicators');
    }

    // Usage pattern matching
    const userActivity = userFeatures[4]; // Session count
    const resourceComplexity = resourceFeatures[4]; // Difficulty
    if (userActivity > 0.5 && resourceComplexity > 0.6) {
      score += 0.2;
      reasons.push('Suitable complexity for active users');
    }

    // Effectiveness correlation
    const resourceEffectiveness = resourceFeatures[0]; // Average rating
    score += resourceEffectiveness * 0.3;
    if (resourceEffectiveness > 0.8) {
      reasons.push('Highly effective based on user feedback');
    }

    // Add some randomness for exploration
    score += Math.random() * 0.1;

    return { score: Math.min(score, 1.0), reasons };
  }

  private calculateUrgency(riskLevel: string, resourceType: string): 'low' | 'medium' | 'high' | 'urgent' {
    if (riskLevel === 'severe' && resourceType === 'crisis') return 'urgent';
    if (riskLevel === 'severe') return 'high';
    if (riskLevel === 'moderate') return 'medium';
    return 'low';
  }

  private estimateHelpfulness(resource: MentalHealthResource, userProfile: UserProfile): number {
    // Combine resource effectiveness with user-specific factors
    let helpfulness = resource.effectiveness.averageRating / 5;
    
    // Adjust based on user's risk level
    const riskLevel = userProfile.phq4Scores.latest.riskLevel;
    if (resource.metadata.riskLevels.includes(riskLevel)) {
      helpfulness += 0.2;
    }

    // Adjust based on language match
    if (resource.metadata.languages.includes(userProfile.demographics.language)) {
      helpfulness += 0.1;
    }

    return Math.min(helpfulness, 1.0);
  }

  private encodeRiskLevel(riskLevel: string): number {
    const mapping = { 'minimal': 0.25, 'mild': 0.5, 'moderate': 0.75, 'severe': 1.0 };
    return mapping[riskLevel as keyof typeof mapping] || 0;
  }

  private encodeCategory(value: string, categories: string[]): number {
    const index = categories.indexOf(value);
    return index >= 0 ? (index + 1) / categories.length : 0;
  }

  /**
   * A/B testing and strategy selection
   */
  private getRecommendationStrategy(userProfile: UserProfile, abTestGroup?: string): string {
    if (!abTestGroup) return 'hybrid'; // Default strategy

    const activeTest = Array.from(this.abTests.values()).find(test => 
      test.active && test.trafficSplit[abTestGroup]
    );

    if (activeTest && activeTest.variants[abTestGroup]) {
      return activeTest.variants[abTestGroup].strategy;
    }

    return 'hybrid';
  }

  private applyContextFilters(recommendations: Recommendation[], context: any): Recommendation[] {
    let filtered = recommendations;

    // Filter by type
    if (context.includeTypes?.length) {
      filtered = filtered.filter(rec => 
        context.includeTypes.includes(rec.resource.type)
      );
    }

    if (context.excludeTypes?.length) {
      filtered = filtered.filter(rec => 
        !context.excludeTypes.includes(rec.resource.type)
      );
    }

    // Filter by urgency
    if (context.urgencyFilter) {
      const urgencyOrder = { 'low': 1, 'medium': 2, 'high': 3, 'urgent': 4 };
      const minUrgency = urgencyOrder[context.urgencyFilter as keyof typeof urgencyOrder];
      filtered = filtered.filter(rec => 
        urgencyOrder[rec.urgency] >= minUrgency
      );
    }

    return filtered;
  }

  private addPersonalizedMessages(recommendations: Recommendation[], userProfile: UserProfile): Recommendation[] {
    return recommendations.map(rec => {
      const riskLevel = userProfile.phq4Scores.latest.riskLevel;
      const name = userProfile.demographics.countryOfOrigin;
      
      let message = '';
      
      if (rec.urgency === 'urgent') {
        message = 'This resource provides immediate support for your current situation.';
      } else if (rec.strategy === 'collaborative') {
        message = `People with similar backgrounds have found this helpful.`;
      } else if (rec.strategy === 'demographic' && name) {
        message = `This resource is specifically designed for people from ${name}.`;
      } else if (rec.resource.effectiveness.averageRating > 4.5) {
        message = 'This is a highly-rated resource that has helped many people.';
      }

      return {
        ...rec,
        personalizedMessage: message
      };
    });
  }

  /**
   * Metrics and logging
   */
  private logRecommendationMetrics(
    recommendations: Recommendation[], 
    userProfile: UserProfile, 
    strategy: string,
    abTestGroup?: string
  ): void {
    recommendations.forEach((rec, index) => {
      const metric: RecommendationMetrics = {
        recommendationId: `rec_${Date.now()}_${index}`,
        userId: userProfile.anonymousId,
        timestamp: new Date().toISOString(),
        strategy,
        abTestGroup,
        resourceId: rec.resource.id,
        score: rec.score,
        position: index,
        viewed: false,
        clicked: false,
        completed: false,
        triggerContext: 'system_generated',
        userRiskLevel: userProfile.phq4Scores.latest.riskLevel,
        timeOfDay: new Date().getHours().toString()
      };

      this.metrics.push(metric);
    });
  }

  /**
   * Track user interactions with recommendations
   */
  trackInteraction(
    recommendationId: string, 
    interactionType: 'view' | 'click' | 'complete' | 'rate',
    data?: any
  ): void {
    const metric = this.metrics.find(m => m.recommendationId === recommendationId);
    if (metric) {
      switch (interactionType) {
        case 'view':
          metric.viewed = true;
          break;
        case 'click':
          metric.clicked = true;
          metric.timeToClick = data?.timeToClick;
          break;
        case 'complete':
          metric.completed = true;
          metric.engagementDuration = data?.duration;
          break;
        case 'rate':
          metric.rating = data?.rating;
          metric.helpfulnessRating = data?.helpfulness;
          break;
      }
    }
  }

  /**
   * Initialize sample resources
   */
  private initializeResources(): void {
    this.resources = [
      {
        id: 'res_001',
        type: 'therapy',
        title: 'Multilingual Counseling Services',
        description: 'Professional counseling available in multiple languages for migrant workers',
        metadata: {
          languages: ['en', 'zh', 'bn', 'ta', 'my', 'idn'],
          culturalContext: ['Bangladesh', 'India', 'Philippines', 'Indonesia', 'Myanmar'],
          targetDemographics: {
            employmentSectors: ['Construction', 'Domestic Work', 'Manufacturing'],
            countries: ['Singapore', 'Malaysia', 'UAE', 'Saudi Arabia']
          },
          riskLevels: ['moderate', 'severe'],
          tags: ['professional', 'culturally-sensitive', 'confidential'],
          difficulty: 'beginner',
          duration: 60,
          format: 'individual'
        },
        effectiveness: {
          averageRating: 4.3,
          totalRatings: 127,
          completionRate: 0.78,
          improvementScore: 3.2
        },
        availability: {
          locations: ['Singapore', 'Malaysia', 'UAE'],
          cost: 'free',
          accessRequirements: ['appointment'],
          waitTime: 3
        },
        provider: {
          name: 'Migrant Mental Health Collective',
          type: 'ngo',
          credentials: ['Licensed Therapists', 'Cultural Specialists'],
          contact: {
            phone: '+65-1234-5678',
            email: 'help@mmhc.org',
            whatsapp: '+65-1234-5678'
          }
        }
      },
      // Add more sample resources...
    ];
  }

  /**
   * Initialize A/B tests
   */
  private initializeABTests(): void {
    this.abTests.set('recommendation_strategy_test', {
      id: 'recommendation_strategy_test',
      name: 'Recommendation Strategy Comparison',
      description: 'Testing different recommendation approaches',
      active: true,
      trafficSplit: {
        'control': 25,
        'ml_enhanced': 25,
        'cultural_first': 25,
        'collaborative_heavy': 25
      },
      startDate: '2025-08-01',
      metrics: ['click_through_rate', 'completion_rate', 'satisfaction_rating'],
      variants: {
        'control': {
          strategy: 'content-based',
          weights: { content: 1.0 },
          parameters: {}
        },
        'ml_enhanced': {
          strategy: 'ml-predicted',
          weights: { ml: 0.6, content: 0.4 },
          parameters: { exploration_rate: 0.1 }
        },
        'cultural_first': {
          strategy: 'demographic',
          weights: { demographic: 0.6, cultural: 0.4 },
          parameters: { cultural_weight: 2.0 }
        },
        'collaborative_heavy': {
          strategy: 'hybrid',
          weights: { collaborative: 0.5, content: 0.3, demographic: 0.2 },
          parameters: { min_similar_users: 5 }
        }
      }
    });
  }

  /**
   * Get recommendation analytics
   */
  getAnalytics(timeRange?: { start: string; end: string }): any {
    let metrics = this.metrics;
    
    if (timeRange) {
      metrics = metrics.filter(m => 
        new Date(m.timestamp) >= new Date(timeRange.start) &&
        new Date(m.timestamp) <= new Date(timeRange.end)
      );
    }

    const totalRecommendations = metrics.length;
    const clickedRecommendations = metrics.filter(m => m.clicked).length;
    const completedRecommendations = metrics.filter(m => m.completed).length;

    const strategyPerformance = new Map<string, any>();
    
    for (const strategy of ['content-based', 'collaborative', 'demographic', 'ml-predicted', 'hybrid']) {
      const strategyMetrics = metrics.filter(m => m.strategy === strategy);
      const clicks = strategyMetrics.filter(m => m.clicked).length;
      const completions = strategyMetrics.filter(m => m.completed).length;
      const avgRating = strategyMetrics
        .filter(m => m.rating)
        .reduce((sum, m) => sum + (m.rating || 0), 0) / strategyMetrics.filter(m => m.rating).length;

      strategyPerformance.set(strategy, {
        totalRecommendations: strategyMetrics.length,
        clickThroughRate: strategyMetrics.length > 0 ? clicks / strategyMetrics.length : 0,
        completionRate: strategyMetrics.length > 0 ? completions / strategyMetrics.length : 0,
        averageRating: avgRating || 0
      });
    }

    return {
      overview: {
        totalRecommendations,
        clickThroughRate: totalRecommendations > 0 ? clickedRecommendations / totalRecommendations : 0,
        completionRate: totalRecommendations > 0 ? completedRecommendations / totalRecommendations : 0
      },
      strategyPerformance: Object.fromEntries(strategyPerformance),
      abTestResults: this.getABTestResults()
    };
  }

  private getABTestResults(): any {
    const results = new Map<string, any>();
    
    for (const [testId, test] of this.abTests.entries()) {
      const testMetrics = this.metrics.filter(m => m.abTestGroup);
      const variantResults = new Map<string, any>();
      
      for (const variant of Object.keys(test.variants)) {
        const variantMetrics = testMetrics.filter(m => m.abTestGroup === variant);
        const clicks = variantMetrics.filter(m => m.clicked).length;
        const completions = variantMetrics.filter(m => m.completed).length;
        
        variantResults.set(variant, {
          sample_size: variantMetrics.length,
          click_through_rate: variantMetrics.length > 0 ? clicks / variantMetrics.length : 0,
          completion_rate: variantMetrics.length > 0 ? completions / variantMetrics.length : 0
        });
      }
      
      results.set(testId, {
        test_name: test.name,
        status: test.active ? 'active' : 'inactive',
        variants: Object.fromEntries(variantResults)
      });
    }
    
    return Object.fromEntries(results);
  }
}

export default AIRecommendationEngine;
