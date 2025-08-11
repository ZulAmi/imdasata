import { PHQ4Response } from '../types/assessment';

export interface PHQ4AnalyticsData {
  id: string;
  anonymousId: string;
  totalScore: number;
  depressionScore: number;
  anxietyScore: number;
  riskLevel: 'minimal' | 'mild' | 'moderate' | 'severe';
  language: string;
  countryOfOrigin?: string;
  ageGroup?: string;
  gender?: string;
  employmentSector?: string;
  timestamp: string;
  completionTime?: number; // seconds to complete
  isComplete: boolean;
}

export interface PopulationTrends {
  totalAssessments: number;
  timeRange: {
    start: string;
    end: string;
  };
  trendData: {
    date: string;
    totalAssessments: number;
    averageScore: number;
    riskDistribution: {
      minimal: number;
      mild: number;
      moderate: number;
      severe: number;
    };
    completionRate: number;
  }[];
  overallTrends: {
    scoreChange: number; // percentage change
    riskLevelChanges: {
      minimal: number;
      mild: number;
      moderate: number;
      severe: number;
    };
    participationGrowth: number;
  };
}

export interface DemographicBreakdown {
  byCountry: {
    [country: string]: {
      totalAssessments: number;
      averageScore: number;
      riskDistribution: {
        minimal: number;
        mild: number;
        moderate: number;
        severe: number;
      };
      commonLanguages: string[];
      employmentSectors: string[];
    };
  };
  byLanguage: {
    [language: string]: {
      totalAssessments: number;
      averageScore: number;
      completionRate: number;
      topCountries: string[];
    };
  };
  byAgeGroup: {
    [ageGroup: string]: {
      totalAssessments: number;
      averageScore: number;
      riskDistribution: {
        minimal: number;
        mild: number;
        moderate: number;
        severe: number;
      };
    };
  };
}

export interface CompletionMetrics {
  overallCompletionRate: number;
  averageCompletionTime: number; // in seconds
  dropoffPoints: {
    question1: number;
    question2: number;
    question3: number;
    question4: number;
  };
  completionByDemographic: {
    byCountry: { [country: string]: number };
    byLanguage: { [language: string]: number };
    byAgeGroup: { [ageGroup: string]: number };
  };
  timeToComplete: {
    fast: number; // <30 seconds
    normal: number; // 30-120 seconds
    slow: number; // >120 seconds
  };
}

export interface HighRiskPatterns {
  totalHighRisk: number;
  highRiskPercentage: number;
  patterns: {
    repeatAssessments: {
      userId: string;
      assessmentCount: number;
      scoreProgression: number[];
      trend: 'improving' | 'stable' | 'worsening';
    }[];
    demographicRiskFactors: {
      country: string;
      language: string;
      ageGroup: string;
      riskMultiplier: number;
    }[];
    temporalPatterns: {
      dayOfWeek: { [day: string]: number };
      timeOfDay: { [hour: string]: number };
      seasonality: { [month: string]: number };
    };
  };
  interventionTriggers: {
    immediateIntervention: string[]; // anonymous IDs
    followUpRequired: string[];
    monitoringList: string[];
  };
}

export interface VisualizationData {
  scoreDistribution: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
    }[];
  };
  trendLines: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }[];
  };
  heatmaps: {
    riskByDemographic: {
      countries: string[];
      riskLevels: string[];
      data: number[][];
    };
    temporalHeatmap: {
      hours: string[];
      days: string[];
      data: number[][];
    };
  };
  geographicData: {
    [country: string]: {
      totalAssessments: number;
      averageScore: number;
      riskLevel: 'minimal' | 'mild' | 'moderate' | 'severe';
      coordinates: [number, number]; // [lat, lng]
    };
  };
}

export class PHQ4Analytics {
  private data: PHQ4AnalyticsData[];

  constructor(data: PHQ4AnalyticsData[]) {
    this.data = data;
  }

  /**
   * Calculate population-level mental health trends
   */
  calculatePopulationTrends(timeRange?: { start: string; end: string }): PopulationTrends {
    const filteredData = timeRange 
      ? this.data.filter(item => 
          new Date(item.timestamp) >= new Date(timeRange.start) &&
          new Date(item.timestamp) <= new Date(timeRange.end)
        )
      : this.data;

    // Group by date for trend analysis
    const dailyData = this.groupByDate(filteredData);
    
    const trendData = Object.entries(dailyData).map(([date, assessments]) => {
      const completed = assessments.filter(a => a.isComplete);
      const totalAssessments = assessments.length;
      const averageScore = completed.length > 0 
        ? completed.reduce((sum, a) => sum + a.totalScore, 0) / completed.length
        : 0;

      const riskDistribution = this.calculateRiskDistribution(completed);
      const completionRate = totalAssessments > 0 ? (completed.length / totalAssessments) * 100 : 0;

      return {
        date,
        totalAssessments,
        averageScore: Math.round(averageScore * 100) / 100,
        riskDistribution,
        completionRate: Math.round(completionRate * 100) / 100
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate overall trends
    const overallTrends = this.calculateOverallTrends(trendData);

    return {
      totalAssessments: filteredData.length,
      timeRange: timeRange || {
        start: filteredData.length > 0 ? filteredData[0].timestamp : new Date().toISOString(),
        end: new Date().toISOString()
      },
      trendData,
      overallTrends
    };
  }

  /**
   * Generate demographic breakdowns by country of origin
   */
  generateDemographicBreakdown(): DemographicBreakdown {
    const completedAssessments = this.data.filter(item => item.isComplete);

    // By Country
    const byCountry = this.groupBy(completedAssessments, 'countryOfOrigin');
    const countryBreakdown: DemographicBreakdown['byCountry'] = {};

    Object.entries(byCountry).forEach(([country, assessments]) => {
      if (!country || country === 'undefined') return;
      
      const averageScore = assessments.reduce((sum, a) => sum + a.totalScore, 0) / assessments.length;
      const riskDistribution = this.calculateRiskDistribution(assessments);
      const languages = [...new Set(assessments.map(a => a.language))];
      const sectors = [...new Set(assessments.map(a => a.employmentSector).filter(Boolean))] as string[];

      countryBreakdown[country] = {
        totalAssessments: assessments.length,
        averageScore: Math.round(averageScore * 100) / 100,
        riskDistribution,
        commonLanguages: languages,
        employmentSectors: sectors
      };
    });

    // By Language
    const byLanguage = this.groupBy(completedAssessments, 'language');
    const languageBreakdown: DemographicBreakdown['byLanguage'] = {};

    Object.entries(byLanguage).forEach(([language, assessments]) => {
      const averageScore = assessments.reduce((sum, a) => sum + a.totalScore, 0) / assessments.length;
      const allAttempts = this.data.filter(item => item.language === language);
      const completionRate = (assessments.length / allAttempts.length) * 100;
      const countries = [...new Set(assessments.map(a => a.countryOfOrigin).filter(Boolean))] as string[];

      languageBreakdown[language] = {
        totalAssessments: assessments.length,
        averageScore: Math.round(averageScore * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        topCountries: countries.slice(0, 5)
      };
    });

    // By Age Group
    const byAgeGroup = this.groupBy(completedAssessments, 'ageGroup');
    const ageGroupBreakdown: DemographicBreakdown['byAgeGroup'] = {};

    Object.entries(byAgeGroup).forEach(([ageGroup, assessments]) => {
      if (!ageGroup || ageGroup === 'undefined') return;
      
      const averageScore = assessments.reduce((sum, a) => sum + a.totalScore, 0) / assessments.length;
      const riskDistribution = this.calculateRiskDistribution(assessments);

      ageGroupBreakdown[ageGroup] = {
        totalAssessments: assessments.length,
        averageScore: Math.round(averageScore * 100) / 100,
        riskDistribution
      };
    });

    return {
      byCountry: countryBreakdown,
      byLanguage: languageBreakdown,
      byAgeGroup: ageGroupBreakdown
    };
  }

  /**
   * Track assessment frequency and completion rates
   */
  trackCompletionMetrics(): CompletionMetrics {
    const totalAttempts = this.data.length;
    const completedAssessments = this.data.filter(item => item.isComplete);
    const overallCompletionRate = (completedAssessments.length / totalAttempts) * 100;

    // Calculate average completion time
    const completionTimes = completedAssessments
      .filter(item => item.completionTime)
      .map(item => item.completionTime!);
    const averageCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    // Analyze drop-off points (simplified - would need more detailed tracking)
    const dropoffPoints = {
      question1: 25, // placeholder percentages
      question2: 15,
      question3: 10,
      question4: 5
    };

    // Completion by demographic
    const completionByDemographic = {
      byCountry: this.calculateCompletionByGroup('countryOfOrigin'),
      byLanguage: this.calculateCompletionByGroup('language'),
      byAgeGroup: this.calculateCompletionByGroup('ageGroup')
    };

    // Time to complete distribution
    const timeToComplete = {
      fast: completionTimes.filter(time => time < 30).length,
      normal: completionTimes.filter(time => time >= 30 && time <= 120).length,
      slow: completionTimes.filter(time => time > 120).length
    };

    return {
      overallCompletionRate: Math.round(overallCompletionRate * 100) / 100,
      averageCompletionTime: Math.round(averageCompletionTime),
      dropoffPoints,
      completionByDemographic,
      timeToComplete
    };
  }

  /**
   * Identify high-risk user patterns
   */
  identifyHighRiskPatterns(): HighRiskPatterns {
    const highRiskAssessments = this.data.filter(item => 
      item.isComplete && (item.riskLevel === 'severe' || item.riskLevel === 'moderate')
    );

    const totalHighRisk = highRiskAssessments.length;
    const highRiskPercentage = (totalHighRisk / this.data.filter(item => item.isComplete).length) * 100;

    // Analyze repeat assessments
    const userAssessments = this.groupBy(highRiskAssessments, 'anonymousId');
    const repeatAssessments = Object.entries(userAssessments)
      .filter(([_, assessments]) => assessments.length > 1)
      .map(([userId, assessments]) => {
        const sortedAssessments = assessments.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        const scoreProgression = sortedAssessments.map(a => a.totalScore);
        const trend = this.analyzeTrend(scoreProgression);

        return {
          userId,
          assessmentCount: assessments.length,
          scoreProgression,
          trend
        };
      });

    // Demographic risk factors
    const demographicRiskFactors = this.calculateDemographicRiskFactors();

    // Temporal patterns
    const temporalPatterns = this.analyzeTemporalPatterns(highRiskAssessments);

    // Intervention triggers
    const interventionTriggers = this.generateInterventionTriggers(highRiskAssessments);

    return {
      totalHighRisk,
      highRiskPercentage: Math.round(highRiskPercentage * 100) / 100,
      patterns: {
        repeatAssessments,
        demographicRiskFactors,
        temporalPatterns
      },
      interventionTriggers
    };
  }

  /**
   * Create visualization data for admin dashboard
   */
  createVisualizationData(): VisualizationData {
    const completedAssessments = this.data.filter(item => item.isComplete);

    // Score distribution chart
    const scoreRanges = ['0-2', '3-5', '6-8', '9-12'];
    const scoreDistribution = {
      labels: scoreRanges,
      datasets: [{
        label: 'Score Distribution',
        data: [
          completedAssessments.filter(a => a.totalScore <= 2).length,
          completedAssessments.filter(a => a.totalScore >= 3 && a.totalScore <= 5).length,
          completedAssessments.filter(a => a.totalScore >= 6 && a.totalScore <= 8).length,
          completedAssessments.filter(a => a.totalScore >= 9).length
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#DC2626'],
        borderColor: ['#059669', '#D97706', '#DC2626', '#B91C1C']
      }]
    };

    // Trend lines
    const dailyData = this.groupByDate(completedAssessments);
    const sortedDates = Object.keys(dailyData).sort();
    const trendLines = {
      labels: sortedDates,
      datasets: [{
        label: 'Average Daily Score',
        data: sortedDates.map(date => {
          const dayAssessments = dailyData[date];
          return dayAssessments.reduce((sum, a) => sum + a.totalScore, 0) / dayAssessments.length;
        }),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }]
    };

    // Risk heatmap by demographic
    const countries = [...new Set(completedAssessments.map(a => a.countryOfOrigin).filter(Boolean))] as string[];
    const riskLevels = ['minimal', 'mild', 'moderate', 'severe'];
    const riskByDemographic = {
      countries,
      riskLevels,
      data: countries.map(country => 
        riskLevels.map(risk => 
          completedAssessments.filter(a => a.countryOfOrigin === country && a.riskLevel === risk).length
        )
      )
    };

    // Temporal heatmap
    const hours = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'));
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const temporalHeatmap = {
      hours,
      days,
      data: days.map(day => 
        hours.map(hour => 
          completedAssessments.filter(a => {
            const date = new Date(a.timestamp);
            return date.getDay() === days.indexOf(day) && date.getHours() === parseInt(hour);
          }).length
        )
      )
    };

    // Geographic data
    const countryCoordinates: { [key: string]: [number, number] } = {
      'Bangladesh': [23.6850, 90.3563],
      'India': [20.5937, 78.9629],
      'Philippines': [12.8797, 121.7740],
      'Indonesia': [-0.7893, 113.9213],
      'Myanmar': [21.9162, 95.9560],
      'Thailand': [15.8700, 100.9925],
      'Vietnam': [14.0583, 108.2772],
      'Nepal': [28.3949, 84.1240],
      'Sri Lanka': [7.8731, 80.7718]
    };

    const geographicData: VisualizationData['geographicData'] = {};
    Object.entries(this.groupBy(completedAssessments, 'countryOfOrigin')).forEach(([country, assessments]) => {
      if (!country || country === 'undefined' || !countryCoordinates[country]) return;
      
      const averageScore = assessments.reduce((sum, a) => sum + a.totalScore, 0) / assessments.length;
      const riskLevel = averageScore >= 9 ? 'severe' : 
                      averageScore >= 6 ? 'moderate' : 
                      averageScore >= 3 ? 'mild' : 'minimal';

      geographicData[country] = {
        totalAssessments: assessments.length,
        averageScore: Math.round(averageScore * 100) / 100,
        riskLevel,
        coordinates: countryCoordinates[country]
      };
    });

    return {
      scoreDistribution,
      trendLines,
      heatmaps: {
        riskByDemographic,
        temporalHeatmap
      },
      geographicData
    };
  }

  /**
   * Export anonymized data for research purposes
   */
  exportAnonymizedData(includeMetadata = true): any {
    const exportData = this.data.map(item => {
      const baseData = {
        assessmentId: item.id,
        totalScore: item.totalScore,
        depressionScore: item.depressionScore,
        anxietyScore: item.anxietyScore,
        riskLevel: item.riskLevel,
        language: item.language,
        timestamp: item.timestamp,
        isComplete: item.isComplete
      };

      if (includeMetadata) {
        return {
          ...baseData,
          countryOfOrigin: item.countryOfOrigin,
          ageGroup: item.ageGroup,
          gender: item.gender,
          employmentSector: item.employmentSector,
          completionTime: item.completionTime
        };
      }

      return baseData;
    });

    const metadata = {
      exportDate: new Date().toISOString(),
      totalRecords: exportData.length,
      completedAssessments: exportData.filter(item => item.isComplete).length,
      dataFields: Object.keys(exportData[0] || {}),
      privacyNote: 'All personal identifiers have been removed. Anonymous IDs are excluded to prevent re-identification.',
      ethicsApproval: 'Data exported for research purposes under institutional ethics approval.',
      dataRetention: 'Research data should be handled according to institutional data governance policies.'
    };

    return {
      metadata,
      data: exportData
    };
  }

  // Helper methods
  private groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key] || 'unknown');
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(item);
      return groups;
    }, {} as { [key: string]: T[] });
  }

  private groupByDate(data: PHQ4AnalyticsData[]): { [date: string]: PHQ4AnalyticsData[] } {
    return data.reduce((groups, item) => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      groups[date] = groups[date] || [];
      groups[date].push(item);
      return groups;
    }, {} as { [date: string]: PHQ4AnalyticsData[] });
  }

  private calculateRiskDistribution(assessments: PHQ4AnalyticsData[]) {
    const total = assessments.length;
    if (total === 0) return { minimal: 0, mild: 0, moderate: 0, severe: 0 };

    return {
      minimal: Math.round((assessments.filter(a => a.riskLevel === 'minimal').length / total) * 100),
      mild: Math.round((assessments.filter(a => a.riskLevel === 'mild').length / total) * 100),
      moderate: Math.round((assessments.filter(a => a.riskLevel === 'moderate').length / total) * 100),
      severe: Math.round((assessments.filter(a => a.riskLevel === 'severe').length / total) * 100)
    };
  }

  private calculateOverallTrends(trendData: any[]) {
    if (trendData.length < 2) {
      return {
        scoreChange: 0,
        riskLevelChanges: { minimal: 0, mild: 0, moderate: 0, severe: 0 },
        participationGrowth: 0
      };
    }

    const first = trendData[0];
    const last = trendData[trendData.length - 1];

    const scoreChange = ((last.averageScore - first.averageScore) / first.averageScore) * 100;
    const participationGrowth = ((last.totalAssessments - first.totalAssessments) / first.totalAssessments) * 100;

    const riskLevelChanges = {
      minimal: last.riskDistribution.minimal - first.riskDistribution.minimal,
      mild: last.riskDistribution.mild - first.riskDistribution.mild,
      moderate: last.riskDistribution.moderate - first.riskDistribution.moderate,
      severe: last.riskDistribution.severe - first.riskDistribution.severe
    };

    return {
      scoreChange: Math.round(scoreChange * 100) / 100,
      riskLevelChanges,
      participationGrowth: Math.round(participationGrowth * 100) / 100
    };
  }

  private calculateCompletionByGroup(groupKey: keyof PHQ4AnalyticsData): { [key: string]: number } {
    const groups = this.groupBy(this.data, groupKey);
    const result: { [key: string]: number } = {};

    Object.entries(groups).forEach(([key, assessments]) => {
      if (key === 'undefined' || !key) return;
      const completionRate = (assessments.filter(a => a.isComplete).length / assessments.length) * 100;
      result[key] = Math.round(completionRate * 100) / 100;
    });

    return result;
  }

  private analyzeTrend(scores: number[]): 'improving' | 'stable' | 'worsening' {
    if (scores.length < 2) return 'stable';
    
    const first = scores[0];
    const last = scores[scores.length - 1];
    const change = last - first;

    if (change > 1) return 'worsening';
    if (change < -1) return 'improving';
    return 'stable';
  }

  private calculateDemographicRiskFactors() {
    const completedAssessments = this.data.filter(item => item.isComplete);
    const overallRiskRate = completedAssessments.filter(a => a.riskLevel === 'severe' || a.riskLevel === 'moderate').length / completedAssessments.length;

    const factors: any[] = [];

    // Analyze by country
    const byCountry = this.groupBy(completedAssessments, 'countryOfOrigin');
    Object.entries(byCountry).forEach(([country, assessments]) => {
      if (!country || country === 'undefined') return;
      const riskRate = assessments.filter(a => a.riskLevel === 'severe' || a.riskLevel === 'moderate').length / assessments.length;
      const riskMultiplier = riskRate / overallRiskRate;
      
      if (riskMultiplier > 1.2) { // 20% higher than average
        factors.push({
          country,
          language: assessments[0].language,
          ageGroup: assessments[0].ageGroup || 'unknown',
          riskMultiplier: Math.round(riskMultiplier * 100) / 100
        });
      }
    });

    return factors.sort((a, b) => b.riskMultiplier - a.riskMultiplier);
  }

  private analyzeTemporalPatterns(assessments: PHQ4AnalyticsData[]) {
    const dayOfWeek: { [day: string]: number } = {};
    const timeOfDay: { [hour: string]: number } = {};
    const seasonality: { [month: string]: number } = {};

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize counters
    days.forEach(day => dayOfWeek[day] = 0);
    for (let i = 0; i < 24; i++) {
      timeOfDay[i.toString().padStart(2, '0')] = 0;
    }
    months.forEach(month => seasonality[month] = 0);

    assessments.forEach(assessment => {
      const date = new Date(assessment.timestamp);
      const day = days[date.getDay()];
      const hour = date.getHours().toString().padStart(2, '0');
      const month = months[date.getMonth()];

      dayOfWeek[day]++;
      timeOfDay[hour]++;
      seasonality[month]++;
    });

    return {
      dayOfWeek,
      timeOfDay,
      seasonality
    };
  }

  private generateInterventionTriggers(highRiskAssessments: PHQ4AnalyticsData[]) {
    const severeRisk = highRiskAssessments.filter(a => a.riskLevel === 'severe');
    const moderateRisk = highRiskAssessments.filter(a => a.riskLevel === 'moderate');

    // Recent severe assessments need immediate intervention
    const immediateIntervention = severeRisk
      .filter(a => {
        const assessmentDate = new Date(a.timestamp);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return assessmentDate > oneDayAgo;
      })
      .map(a => a.anonymousId);

    // Moderate risk or older severe cases need follow-up
    const followUpRequired = [
      ...moderateRisk.map(a => a.anonymousId),
      ...severeRisk
        .filter(a => !immediateIntervention.includes(a.anonymousId))
        .map(a => a.anonymousId)
    ];

    // Users with multiple assessments showing concerning trends
    const userAssessments = this.groupBy(this.data.filter(item => item.isComplete), 'anonymousId');
    const monitoringList = Object.entries(userAssessments)
      .filter(([_, assessments]) => {
        if (assessments.length < 2) return false;
        const sortedAssessments = assessments.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        const trend = this.analyzeTrend(sortedAssessments.map(a => a.totalScore));
        return trend === 'worsening';
      })
      .map(([userId]) => userId);

    return {
      immediateIntervention: [...new Set(immediateIntervention)],
      followUpRequired: [...new Set(followUpRequired)],
      monitoringList: [...new Set(monitoringList)]
    };
  }
}
