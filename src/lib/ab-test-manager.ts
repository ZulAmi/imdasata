/**
 * A/B Testing utilities for recommendation engine optimization
 */

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-1, relative weight for traffic split
  config: {
    strategy: 'content-based' | 'collaborative' | 'demographic' | 'ml-predicted' | 'hybrid';
    parameters: Record<string, any>;
    modelWeights?: Record<string, number>;
  };
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  targetMetrics: string[];
  variants: ABTestVariant[];
  trafficAllocation: number; // 0-1, percentage of users to include in test
  
  // Segmentation criteria
  includeCriteria?: {
    riskLevels?: string[];
    countries?: string[];
    employmentSectors?: string[];
    languages?: string[];
    ageGroups?: string[];
    minSessions?: number;
  };
  
  // Statistical configuration
  statisticalConfig: {
    minSampleSize: number;
    confidenceLevel: number; // 0.95 for 95%
    minDetectableEffect: number; // minimum effect size to detect
    power: number; // statistical power, typically 0.8
  };
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  timestamp: string;
  userId: string;
  
  // Outcome metrics
  primaryMetric: number; // e.g., click-through rate
  secondaryMetrics: Record<string, number>;
  
  // User context
  userRiskLevel: string;
  userCountry: string;
  userEmploymentSector: string;
  userLanguage: string;
  
  // Interaction data
  recommendationsShown: number;
  recommendationsClicked: number;
  recommendationsCompleted: number;
  sessionDuration: number;
  satisfactionRating?: number;
  helpfulnessRating?: number;
}

export class ABTestManager {
  private tests: Map<string, ABTest> = new Map();
  private results: ABTestResult[] = [];
  private userAssignments: Map<string, { testId: string; variantId: string }> = new Map();

  constructor() {
    this.initializeDefaultTests();
  }

  /**
   * Initialize default A/B tests for recommendation strategies
   */
  private initializeDefaultTests(): void {
    const strategiesTest: ABTest = {
      id: 'recommendation_strategies_2025',
      name: 'Recommendation Strategy Optimization',
      description: 'Compare different recommendation approaches for effectiveness',
      status: 'active',
      startDate: '2025-08-01T00:00:00Z',
      endDate: '2025-12-31T23:59:59Z',
      targetMetrics: ['click_through_rate', 'completion_rate', 'user_satisfaction', 'recommendation_diversity'],
      trafficAllocation: 0.8, // 80% of users
      variants: [
        {
          id: 'control_content_based',
          name: 'Control: Content-Based',
          weight: 0.25,
          config: {
            strategy: 'content-based',
            parameters: {
              riskLevelWeight: 0.4,
              languageWeight: 0.3,
              culturalWeight: 0.2,
              locationWeight: 0.1
            }
          }
        },
        {
          id: 'enhanced_collaborative',
          name: 'Enhanced Collaborative Filtering',
          weight: 0.25,
          config: {
            strategy: 'collaborative',
            parameters: {
              minSimilarUsers: 5,
              similarityThreshold: 0.3,
              decayFactor: 0.95, // for time-based weighting
              diversityBoost: 0.1
            }
          }
        },
        {
          id: 'cultural_priority',
          name: 'Cultural-Priority Matching',
          weight: 0.25,
          config: {
            strategy: 'demographic',
            parameters: {
              culturalWeight: 0.4,
              languageWeight: 0.3,
              countryWeight: 0.2,
              employmentWeight: 0.1
            }
          }
        },
        {
          id: 'ml_optimized',
          name: 'ML-Optimized Hybrid',
          weight: 0.25,
          config: {
            strategy: 'hybrid',
            parameters: {
              learningRate: 0.01,
              explorationRate: 0.1,
              adaptationSpeed: 0.05
            },
            modelWeights: {
              contentBased: 0.3,
              collaborative: 0.25,
              demographic: 0.2,
              mlPredicted: 0.25
            }
          }
        }
      ],
      statisticalConfig: {
        minSampleSize: 100,
        confidenceLevel: 0.95,
        minDetectableEffect: 0.05, // 5% improvement
        power: 0.8
      }
    };

    this.tests.set(strategiesTest.id, strategiesTest);

    // Crisis intervention optimization test
    const crisisTest: ABTest = {
      id: 'crisis_optimization_2025',
      name: 'Crisis Resource Prioritization',
      description: 'Optimize how crisis resources are recommended to high-risk users',
      status: 'active',
      startDate: '2025-08-01T00:00:00Z',
      targetMetrics: ['crisis_resource_utilization', 'follow_up_engagement', 'safety_metrics'],
      trafficAllocation: 1.0, // All high-risk users
      includeCriteria: {
        riskLevels: ['severe']
      },
      variants: [
        {
          id: 'immediate_crisis_focus',
          name: 'Immediate Crisis Focus',
          weight: 0.5,
          config: {
            strategy: 'content-based',
            parameters: {
              crisisResourcePriority: 0.8,
              urgencyMultiplier: 2.0,
              diversityReduction: 0.5
            }
          }
        },
        {
          id: 'balanced_crisis_support',
          name: 'Balanced Crisis + Support',
          weight: 0.5,
          config: {
            strategy: 'hybrid',
            parameters: {
              crisisResourcePriority: 0.6,
              supportResourceMix: 0.4,
              urgencyMultiplier: 1.5
            }
          }
        }
      ],
      statisticalConfig: {
        minSampleSize: 50,
        confidenceLevel: 0.95,
        minDetectableEffect: 0.1,
        power: 0.8
      }
    };

    this.tests.set(crisisTest.id, crisisTest);
  }

  /**
   * Assign user to A/B test variant
   */
  assignUserToTest(userId: string, userProfile: any): { testId: string; variantId: string } | null {
    // Check if user is already assigned
    const existingAssignment = this.userAssignments.get(userId);
    if (existingAssignment) {
      return existingAssignment;
    }

    // Find applicable active tests
    const applicableTests = Array.from(this.tests.values()).filter(test => 
      test.status === 'active' && this.isUserEligible(test, userProfile)
    );

    if (applicableTests.length === 0) {
      return null;
    }

    // For simplicity, assign to first applicable test
    // In production, you might want more sophisticated assignment logic
    const test = applicableTests[0];
    
    // Check traffic allocation
    const userHash = this.hashUserId(userId);
    if (userHash > test.trafficAllocation) {
      return null; // User not in test traffic
    }

    // Assign to variant based on weights
    const variantId = this.selectVariant(test, userHash);
    const assignment = { testId: test.id, variantId };
    
    this.userAssignments.set(userId, assignment);
    return assignment;
  }

  /**
   * Check if user is eligible for test
   */
  private isUserEligible(test: ABTest, userProfile: any): boolean {
    const criteria = test.includeCriteria;
    if (!criteria) return true;

    if (criteria.riskLevels && !criteria.riskLevels.includes(userProfile.riskLevel)) {
      return false;
    }

    if (criteria.countries && !criteria.countries.includes(userProfile.demographics.location?.country)) {
      return false;
    }

    if (criteria.employmentSectors && !criteria.employmentSectors.includes(userProfile.demographics.employmentSector)) {
      return false;
    }

    if (criteria.languages && !criteria.languages.includes(userProfile.demographics.language)) {
      return false;
    }

    if (criteria.minSessions && userProfile.usagePatterns.totalSessions < criteria.minSessions) {
      return false;
    }

    return true;
  }

  /**
   * Generate deterministic hash for user ID (0-1)
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  /**
   * Select variant based on weights and user hash
   */
  private selectVariant(test: ABTest, userHash: number): string {
    let cumulativeWeight = 0;
    const totalWeight = test.variants.reduce((sum, variant) => sum + variant.weight, 0);
    
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight / totalWeight;
      if (userHash <= cumulativeWeight) {
        return variant.id;
      }
    }
    
    // Fallback to last variant
    return test.variants[test.variants.length - 1].id;
  }

  /**
   * Record A/B test result
   */
  recordResult(result: ABTestResult): void {
    this.results.push({
      ...result,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get test configuration for variant
   */
  getTestConfig(testId: string, variantId: string): ABTestVariant['config'] | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const variant = test.variants.find(v => v.id === variantId);
    return variant?.config || null;
  }

  /**
   * Get A/B test analytics
   */
  getTestAnalytics(testId: string, timeRange?: { start: string; end: string }): any {
    const test = this.tests.get(testId);
    if (!test) return null;

    let testResults = this.results.filter(r => r.testId === testId);
    
    if (timeRange) {
      testResults = testResults.filter(r => 
        new Date(r.timestamp) >= new Date(timeRange.start) &&
        new Date(r.timestamp) <= new Date(timeRange.end)
      );
    }

    const variantAnalytics = new Map<string, any>();

    for (const variant of test.variants) {
      const variantResults = testResults.filter(r => r.variantId === variant.id);
      
      if (variantResults.length === 0) {
        variantAnalytics.set(variant.id, {
          name: variant.name,
          sampleSize: 0,
          metrics: {}
        });
        continue;
      }

      const metrics = {
        click_through_rate: this.calculateMean(variantResults.map(r => 
          r.recommendationsShown > 0 ? r.recommendationsClicked / r.recommendationsShown : 0
        )),
        completion_rate: this.calculateMean(variantResults.map(r => 
          r.recommendationsClicked > 0 ? r.recommendationsCompleted / r.recommendationsClicked : 0
        )),
        user_satisfaction: this.calculateMean(variantResults
          .filter(r => r.satisfactionRating)
          .map(r => r.satisfactionRating!)
        ),
        recommendation_diversity: this.calculateDiversity(variantResults),
        avg_session_duration: this.calculateMean(variantResults.map(r => r.sessionDuration))
      };

      const confidence = this.calculateConfidenceInterval(
        variantResults.map(r => r.primaryMetric),
        test.statisticalConfig.confidenceLevel
      );

      variantAnalytics.set(variant.id, {
        name: variant.name,
        sampleSize: variantResults.length,
        metrics,
        confidence,
        statisticalSignificance: this.calculateStatisticalSignificance(variantResults, test)
      });
    }

    return {
      testId,
      testName: test.name,
      status: test.status,
      variants: Object.fromEntries(variantAnalytics),
      overallResults: this.calculateOverallTestResults(testResults, test),
      recommendations: this.generateTestRecommendations(variantAnalytics, test)
    };
  }

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateDiversity(results: ABTestResult[]): number {
    // Simplified diversity calculation
    // In practice, you might measure unique resources recommended
    const uniqueUsers = new Set(results.map(r => r.userId)).size;
    return uniqueUsers / Math.max(results.length, 1);
  }

  private calculateConfidenceInterval(values: number[], confidenceLevel: number): { lower: number; upper: number } {
    if (values.length === 0) return { lower: 0, upper: 0 };
    
    const mean = this.calculateMean(values);
    const std = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );
    
    const tValue = 1.96; // Approximate for 95% confidence
    const marginOfError = tValue * (std / Math.sqrt(values.length));
    
    return {
      lower: Math.max(0, mean - marginOfError),
      upper: Math.min(1, mean + marginOfError)
    };
  }

  private calculateStatisticalSignificance(results: ABTestResult[], test: ABTest): boolean {
    // Simplified significance test
    return results.length >= test.statisticalConfig.minSampleSize;
  }

  private calculateOverallTestResults(results: ABTestResult[], test: ABTest): any {
    return {
      totalParticipants: new Set(results.map(r => r.userId)).size,
      totalInteractions: results.length,
      testDuration: test.endDate ? 
        Math.ceil((new Date(test.endDate).getTime() - new Date(test.startDate).getTime()) / (1000 * 60 * 60 * 24)) :
        Math.ceil((Date.now() - new Date(test.startDate).getTime()) / (1000 * 60 * 60 * 24))
    };
  }

  private generateTestRecommendations(variantAnalytics: Map<string, any>, test: ABTest): string[] {
    const recommendations: string[] = [];
    
    // Find best performing variant
    let bestVariant = '';
    let bestMetric = -1;
    
    for (const [variantId, analytics] of variantAnalytics.entries()) {
      const primaryMetric = analytics.metrics.click_through_rate || 0;
      if (primaryMetric > bestMetric && analytics.sampleSize >= 30) {
        bestMetric = primaryMetric;
        bestVariant = analytics.name;
      }
    }

    if (bestVariant) {
      recommendations.push(`Consider implementing ${bestVariant} as the primary strategy`);
    }

    // Check for statistical significance
    const hasSignificantResults = Array.from(variantAnalytics.values())
      .some(analytics => analytics.statisticalSignificance);
    
    if (!hasSignificantResults) {
      recommendations.push('Continue test to reach statistical significance');
    }

    // Check for large confidence intervals
    const hasWideIntervals = Array.from(variantAnalytics.values())
      .some(analytics => 
        analytics.confidence && 
        (analytics.confidence.upper - analytics.confidence.lower) > 0.2
      );

    if (hasWideIntervals) {
      recommendations.push('Increase sample size to reduce confidence interval width');
    }

    return recommendations;
  }

  /**
   * Create new A/B test
   */
  createTest(test: ABTest): void {
    this.tests.set(test.id, test);
  }

  /**
   * Update test status
   */
  updateTestStatus(testId: string, status: ABTest['status']): void {
    const test = this.tests.get(testId);
    if (test) {
      test.status = status;
      if (status === 'completed') {
        test.endDate = new Date().toISOString();
      }
    }
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTest[] {
    return Array.from(this.tests.values()).filter(test => test.status === 'active');
  }

  /**
   * Export test results for analysis
   */
  exportResults(testId?: string): ABTestResult[] {
    if (testId) {
      return this.results.filter(r => r.testId === testId);
    }
    return [...this.results];
  }
}

export default ABTestManager;
