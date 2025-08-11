/**
 * SATA Mood Analytics Engine
 * Advanced mood data processing, trend analysis, and correlation with assessments
 */

import { EventEmitter } from 'events';

export interface MoodEntry {
  id: string;
  userId: string;
  timestamp: Date;
  moodScore: number; // 1-10 scale
  emoji: string;
  emotion: string;
  phrase?: string;
  voiceNote?: {
    id: string;
    duration: number;
    transcript?: string;
    sentimentScore?: number;
    emotionalAnalysis?: any;
  };
  tags: string[];
  context?: {
    location?: string;
    activity?: string;
    socialSetting?: string;
    weather?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  };
  assessmentCorrelation?: {
    phq4Score?: number;
    gad7Score?: number;
    assessmentId?: string;
    timeDifference?: number; // hours between mood entry and assessment
  };
}

export interface MoodTrend {
  period: 'daily' | 'weekly' | 'monthly';
  direction: 'improving' | 'stable' | 'declining';
  change: number; // percentage change
  confidence: number; // 0-1 confidence score
  significantEvents?: {
    date: Date;
    type: 'peak' | 'dip' | 'recovery';
    context?: string;
  }[];
}

export interface MoodPattern {
  type: 'weekly' | 'monthly' | 'seasonal' | 'temporal';
  description: string;
  strength: number; // 0-1 correlation strength
  recommendation?: string;
  data: {
    labels: string[];
    values: number[];
    confidence: number[];
  };
}

export interface MoodInsight {
  id: string;
  type: 'trend' | 'pattern' | 'correlation' | 'recommendation' | 'alert';
  title: string;
  description: string;
  data?: any;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  generatedAt: Date;
  expiresAt?: Date;
}

export interface MoodCorrelation {
  factor: string;
  correlation: number; // -1 to 1
  significance: number; // 0-1
  sampleSize: number;
  description: string;
  recommendation?: string;
}

export interface MoodExportData {
  userId: string;
  exportDate: Date;
  timeRange: {
    start: Date;
    end: Date;
  };
  summary: {
    totalEntries: number;
    averageMood: number;
    moodRange: {
      highest: number;
      lowest: number;
    };
    trendDirection: string;
    commonTags: string[];
    voiceNoteCount: number;
  };
  entries: MoodEntry[];
  trends: MoodTrend[];
  patterns: MoodPattern[];
  correlations: MoodCorrelation[];
  insights: MoodInsight[];
  assessmentCorrelations?: {
    phq4Correlation: number;
    gad7Correlation: number;
    significantFindings: string[];
  };
}

class MoodAnalyticsEngine extends EventEmitter {
  private moodData: Map<string, MoodEntry[]> = new Map();
  private insights: Map<string, MoodInsight[]> = new Map();
  private patterns: Map<string, MoodPattern[]> = new Map();

  constructor() {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Add a new mood entry and trigger analysis
   */
  async addMoodEntry(entry: MoodEntry): Promise<void> {
    const userEntries = this.moodData.get(entry.userId) || [];
    userEntries.unshift(entry); // Add to beginning for chronological order
    this.moodData.set(entry.userId, userEntries);

    // Trigger real-time analysis
    await this.analyzeUserMood(entry.userId);
    
    this.emit('mood:added', { userId: entry.userId, entry });
  }

  /**
   * Get mood entries for a user within a date range
   */
  getMoodEntries(
    userId: string, 
    startDate?: Date, 
    endDate?: Date
  ): MoodEntry[] {
    const entries = this.moodData.get(userId) || [];
    
    if (!startDate && !endDate) {
      return entries;
    }

    return entries.filter(entry => {
      const entryDate = entry.timestamp;
      const afterStart = !startDate || entryDate >= startDate;
      const beforeEnd = !endDate || entryDate <= endDate;
      return afterStart && beforeEnd;
    });
  }

  /**
   * Calculate mood trends for different time periods
   */
  calculateMoodTrends(userId: string): MoodTrend[] {
    const entries = this.getMoodEntries(userId);
    if (entries.length < 3) return [];

    const trends: MoodTrend[] = [];

    // Daily trend (last 7 days)
    const dailyTrend = this.calculatePeriodTrend(entries, 'daily', 7);
    if (dailyTrend) trends.push(dailyTrend);

    // Weekly trend (last 4 weeks)
    const weeklyTrend = this.calculatePeriodTrend(entries, 'weekly', 28);
    if (weeklyTrend) trends.push(weeklyTrend);

    // Monthly trend (last 3 months)
    const monthlyTrend = this.calculatePeriodTrend(entries, 'monthly', 90);
    if (monthlyTrend) trends.push(monthlyTrend);

    return trends;
  }

  private calculatePeriodTrend(
    entries: MoodEntry[], 
    period: 'daily' | 'weekly' | 'monthly',
    days: number
  ): MoodTrend | null {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const relevantEntries = entries.filter(e => e.timestamp >= cutoffDate);
    
    if (relevantEntries.length < 3) return null;

    // Calculate trend using linear regression
    const dataPoints = relevantEntries.map((entry, index) => ({
      x: index,
      y: entry.moodScore
    }));

    const { slope, confidence } = this.linearRegression(dataPoints);
    
    // Determine direction based on slope
    let direction: 'improving' | 'stable' | 'declining';
    if (slope > 0.1) direction = 'improving';
    else if (slope < -0.1) direction = 'declining';
    else direction = 'stable';

    // Calculate percentage change
    const firstHalf = relevantEntries.slice(-Math.floor(relevantEntries.length / 2));
    const secondHalf = relevantEntries.slice(0, Math.floor(relevantEntries.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, e) => sum + e.moodScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.moodScore, 0) / secondHalf.length;
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    // Identify significant events
    const significantEvents = this.identifySignificantEvents(relevantEntries);

    return {
      period,
      direction,
      change,
      confidence,
      significantEvents
    };
  }

  private linearRegression(points: { x: number; y: number }[]): { slope: number; confidence: number } {
    const n = points.length;
    if (n < 2) return { slope: 0, confidence: 0 };

    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calculate R-squared for confidence
    const meanY = sumY / n;
    const totalSumSquares = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
    const residualSumSquares = points.reduce((sum, p) => {
      const predicted = slope * p.x + (sumY - slope * sumX) / n;
      return sum + Math.pow(p.y - predicted, 2);
    }, 0);

    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    const confidence = Math.max(0, Math.min(1, rSquared));

    return { slope, confidence };
  }

  private identifySignificantEvents(entries: MoodEntry[]): MoodTrend['significantEvents'] {
    if (entries.length < 5) return [];

    const events: MoodTrend['significantEvents'] = [];
    const scores = entries.map(e => e.moodScore);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const stdDev = Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length);

    entries.forEach((entry, index) => {
      const zScore = (entry.moodScore - mean) / stdDev;
      
      if (Math.abs(zScore) > 1.5) { // Significant deviation
        const type = zScore > 1.5 ? 'peak' : 'dip';
        let context = entry.phrase || '';
        
        if (entry.tags.length > 0) {
          context += ` (${entry.tags.join(', ')})`;
        }

        events.push({
          date: entry.timestamp,
          type,
          context: context || undefined
        });
      }
    });

    return events;
  }

  /**
   * Identify patterns in mood data
   */
  identifyMoodPatterns(userId: string): MoodPattern[] {
    const entries = this.getMoodEntries(userId);
    if (entries.length < 14) return []; // Need at least 2 weeks of data

    const patterns: MoodPattern[] = [];

    // Weekly patterns (day of week analysis)
    const weeklyPattern = this.analyzeWeeklyPattern(entries);
    if (weeklyPattern) patterns.push(weeklyPattern);

    // Time of day patterns
    const temporalPattern = this.analyzeTemporalPattern(entries);
    if (temporalPattern) patterns.push(temporalPattern);

    // Tag correlation patterns
    const tagPatterns = this.analyzeTagPatterns(entries);
    patterns.push(...tagPatterns);

    this.patterns.set(userId, patterns);
    return patterns;
  }

  private analyzeWeeklyPattern(entries: MoodEntry[]): MoodPattern | null {
    const dayAverages = new Array(7).fill(0).map(() => ({ sum: 0, count: 0 }));
    
    entries.forEach(entry => {
      const dayOfWeek = entry.timestamp.getDay();
      dayAverages[dayOfWeek].sum += entry.moodScore;
      dayAverages[dayOfWeek].count += 1;
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const averages = dayAverages.map((day, index) => ({
      day: dayNames[index],
      average: day.count > 0 ? day.sum / day.count : 0,
      confidence: Math.min(1, day.count / 4) // More confidence with more data points
    }));

    // Check if there's a significant pattern
    const scores = averages.map(a => a.average).filter(a => a > 0);
    if (scores.length < 4) return null;

    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const strength = Math.min(1, variance / (mean * mean)); // Coefficient of variation

    if (strength < 0.1) return null; // Not significant enough

    // Find best and worst days
    const bestDay = averages.reduce((best, current) => 
      current.average > best.average ? current : best
    );
    const worstDay = averages.reduce((worst, current) => 
      current.average < worst.average && current.average > 0 ? current : worst
    );

    let recommendation = '';
    if (bestDay.day !== worstDay.day) {
      recommendation = `Your mood tends to be highest on ${bestDay.day}s and lowest on ${worstDay.day}s. Consider planning self-care activities for ${worstDay.day}s.`;
    }

    return {
      type: 'weekly',
      description: `Weekly mood pattern detected with ${(strength * 100).toFixed(0)}% variation`,
      strength,
      recommendation,
      data: {
        labels: averages.map(a => a.day),
        values: averages.map(a => a.average),
        confidence: averages.map(a => a.confidence)
      }
    };
  }

  private analyzeTemporalPattern(entries: MoodEntry[]): MoodPattern | null {
    const timeAverages = {
      morning: { sum: 0, count: 0 },
      afternoon: { sum: 0, count: 0 },
      evening: { sum: 0, count: 0 },
      night: { sum: 0, count: 0 }
    };

    entries.forEach(entry => {
      const hour = entry.timestamp.getHours();
      let timeOfDay: keyof typeof timeAverages;
      
      if (hour >= 6 && hour < 12) timeOfDay = 'morning';
      else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
      else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
      else timeOfDay = 'night';

      timeAverages[timeOfDay].sum += entry.moodScore;
      timeAverages[timeOfDay].count += 1;
    });

    const timeData = Object.entries(timeAverages).map(([time, data]) => ({
      time,
      average: data.count > 0 ? data.sum / data.count : 0,
      confidence: Math.min(1, data.count / 3)
    })).filter(t => t.average > 0);

    if (timeData.length < 2) return null;

    const scores = timeData.map(t => t.average);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const strength = Math.min(1, variance / (mean * mean));

    if (strength < 0.1) return null;

    const bestTime = timeData.reduce((best, current) => 
      current.average > best.average ? current : best
    );
    const worstTime = timeData.reduce((worst, current) => 
      current.average < worst.average ? current : worst
    );

    const recommendation = `Your mood is typically best in the ${bestTime.time} and lowest in the ${worstTime.time}. Consider scheduling important activities during your peak mood times.`;

    return {
      type: 'temporal',
      description: `Time-based mood pattern with ${(strength * 100).toFixed(0)}% variation`,
      strength,
      recommendation,
      data: {
        labels: timeData.map(t => t.time),
        values: timeData.map(t => t.average),
        confidence: timeData.map(t => t.confidence)
      }
    };
  }

  private analyzeTagPatterns(entries: MoodEntry[]): MoodPattern[] {
    const tagMoods = new Map<string, { scores: number[]; count: number }>();

    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        if (!tagMoods.has(tag)) {
          tagMoods.set(tag, { scores: [], count: 0 });
        }
        const tagData = tagMoods.get(tag)!;
        tagData.scores.push(entry.moodScore);
        tagData.count += 1;
      });
    });

    const patterns: MoodPattern[] = [];

    tagMoods.forEach((data, tag) => {
      if (data.count < 3) return; // Need at least 3 occurrences

      const average = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
      const variance = data.scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / data.scores.length;
      
      // Compare to overall average
      const allScores = entries.map(e => e.moodScore);
      const overallAverage = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
      
      const impact = (average - overallAverage) / overallAverage;
      
      if (Math.abs(impact) > 0.15) { // Significant impact
        const description = impact > 0 
          ? `The "${tag}" tag is associated with ${(impact * 100).toFixed(0)}% higher mood scores`
          : `The "${tag}" tag is associated with ${(-impact * 100).toFixed(0)}% lower mood scores`;

        const recommendation = impact > 0
          ? `Consider incorporating more "${tag}" activities into your routine`
          : `The "${tag}" factor may be negatively affecting your mood. Consider strategies to manage this influence`;

        patterns.push({
          type: 'weekly', // Using weekly as a general category
          description,
          strength: Math.abs(impact),
          recommendation,
          data: {
            labels: [tag],
            values: [average],
            confidence: [Math.min(1, data.count / 5)]
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Calculate correlations between mood and assessment scores
   */
  calculateAssessmentCorrelations(userId: string): MoodCorrelation[] {
    const entries = this.getMoodEntries(userId).filter(e => e.assessmentCorrelation);
    if (entries.length < 5) return [];

    const correlations: MoodCorrelation[] = [];

    // PHQ-4 correlation
    const phq4Entries = entries.filter(e => e.assessmentCorrelation?.phq4Score !== undefined);
    if (phq4Entries.length >= 3) {
      const phq4Correlation = this.calculateCorrelation(
        phq4Entries.map(e => e.moodScore),
        phq4Entries.map(e => e.assessmentCorrelation!.phq4Score!)
      );

      correlations.push({
        factor: 'PHQ-4 Depression Screening',
        correlation: -phq4Correlation.correlation, // Inverse: higher PHQ-4 = lower mood
        significance: phq4Correlation.significance,
        sampleSize: phq4Entries.length,
        description: `${Math.abs(phq4Correlation.correlation * 100).toFixed(0)}% correlation between mood entries and depression screening scores`,
        recommendation: phq4Correlation.correlation > 0.6 ? 
          'Strong correlation detected. Mood entries effectively track your mental health progress.' :
          'Consider more detailed mood tracking to better understand your mental health patterns.'
      });
    }

    // GAD-7 correlation
    const gad7Entries = entries.filter(e => e.assessmentCorrelation?.gad7Score !== undefined);
    if (gad7Entries.length >= 3) {
      const gad7Correlation = this.calculateCorrelation(
        gad7Entries.map(e => e.moodScore),
        gad7Entries.map(e => e.assessmentCorrelation!.gad7Score!)
      );

      correlations.push({
        factor: 'GAD-7 Anxiety Assessment',
        correlation: -gad7Correlation.correlation, // Inverse: higher GAD-7 = lower mood
        significance: gad7Correlation.significance,
        sampleSize: gad7Entries.length,
        description: `${Math.abs(gad7Correlation.correlation * 100).toFixed(0)}% correlation between mood entries and anxiety assessment scores`,
        recommendation: gad7Correlation.correlation > 0.6 ? 
          'Mood tracking shows good alignment with your anxiety levels.' :
          'Consider noting anxiety-specific symptoms in your mood entries for better tracking.'
      });
    }

    return correlations;
  }

  private calculateCorrelation(x: number[], y: number[]): { correlation: number; significance: number } {
    if (x.length !== y.length || x.length < 3) {
      return { correlation: 0, significance: 0 };
    }

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    const correlation = denominator === 0 ? 0 : numerator / denominator;
    
    // Calculate significance (simplified t-test)
    const tStat = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
    const significance = Math.min(1, Math.abs(tStat) / (2 + Math.abs(tStat)));

    return { correlation, significance };
  }

  /**
   * Generate personalized insights based on mood data
   */
  async generateInsights(userId: string): Promise<MoodInsight[]> {
    const entries = this.getMoodEntries(userId);
    if (entries.length < 3) return [];

    const insights: MoodInsight[] = [];
    const trends = this.calculateMoodTrends(userId);
    const patterns = this.identifyMoodPatterns(userId);
    const correlations = this.calculateAssessmentCorrelations(userId);

    // Trend insights
    trends.forEach(trend => {
      if (trend.confidence > 0.7) {
        const priority = Math.abs(trend.change) > 20 ? 'high' : 
                        Math.abs(trend.change) > 10 ? 'medium' : 'low';

        insights.push({
          id: `trend-${trend.period}-${Date.now()}`,
          type: 'trend',
          title: `${trend.period.charAt(0).toUpperCase() + trend.period.slice(1)} Mood ${trend.direction.charAt(0).toUpperCase() + trend.direction.slice(1)}`,
          description: `Your mood has been ${trend.direction} by ${Math.abs(trend.change).toFixed(1)}% over the past ${trend.period} period.`,
          data: trend,
          actionable: trend.direction === 'declining',
          priority: trend.direction === 'declining' ? 'high' : priority,
          generatedAt: new Date()
        });
      }
    });

    // Pattern insights
    patterns.forEach((pattern, index) => {
      if (pattern.strength > 0.3) {
        insights.push({
          id: `pattern-${pattern.type}-${Date.now()}-${index}`,
          type: 'pattern',
          title: `${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} Pattern Detected`,
          description: pattern.description,
          data: pattern,
          actionable: !!pattern.recommendation,
          priority: pattern.strength > 0.6 ? 'medium' : 'low',
          generatedAt: new Date()
        });
      }
    });

    // Correlation insights
    correlations.forEach((correlation, index) => {
      if (correlation.significance > 0.5) {
        insights.push({
          id: `correlation-${Date.now()}-${index}`,
          type: 'correlation',
          title: `${correlation.factor} Correlation`,
          description: correlation.description,
          data: correlation,
          actionable: !!correlation.recommendation,
          priority: correlation.significance > 0.8 ? 'high' : 'medium',
          generatedAt: new Date()
        });
      }
    });

    // Risk assessment
    const recentEntries = entries.slice(0, 7); // Last 7 entries
    const recentAverage = recentEntries.reduce((sum, e) => sum + e.moodScore, 0) / recentEntries.length;
    
    if (recentAverage < 4 && recentEntries.length >= 3) {
      insights.push({
        id: `risk-${Date.now()}`,
        type: 'alert',
        title: 'Low Mood Alert',
        description: `Your recent mood scores have been consistently low (average: ${recentAverage.toFixed(1)}/10). Consider reaching out for support.`,
        actionable: true,
        priority: 'critical',
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
      });
    }

    // Positive reinforcement
    if (recentAverage > 7 && recentEntries.length >= 3) {
      insights.push({
        id: `positive-${Date.now()}`,
        type: 'recommendation',
        title: 'Great Progress!',
        description: `Your mood has been consistently positive (average: ${recentAverage.toFixed(1)}/10). Keep up the great work!`,
        actionable: false,
        priority: 'low',
        generatedAt: new Date()
      });
    }

    this.insights.set(userId, insights);
    this.emit('insights:generated', { userId, insights });

    return insights;
  }

  /**
   * Get user insights
   */
  getUserInsights(userId: string): MoodInsight[] {
    return this.insights.get(userId) || [];
  }

  /**
   * Export comprehensive mood data for healthcare providers
   */
  exportMoodData(userId: string, startDate?: Date, endDate?: Date): MoodExportData {
    const entries = this.getMoodEntries(userId, startDate, endDate);
    const trends = this.calculateMoodTrends(userId);
    const patterns = this.identifyMoodPatterns(userId);
    const correlations = this.calculateAssessmentCorrelations(userId);
    const insights = this.getUserInsights(userId);

    // Calculate summary statistics
    const moodScores = entries.map(e => e.moodScore);
    const averageMood = moodScores.length > 0 ? moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length : 0;
    const moodRange = {
      highest: moodScores.length > 0 ? Math.max(...moodScores) : 0,
      lowest: moodScores.length > 0 ? Math.min(...moodScores) : 0
    };

    // Find most common tags
    const tagCounts = new Map<string, number>();
    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    const commonTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Calculate assessment correlations
    const phq4Correlation = correlations.find(c => c.factor.includes('PHQ-4'))?.correlation || 0;
    const gad7Correlation = correlations.find(c => c.factor.includes('GAD-7'))?.correlation || 0;

    const significantFindings = [];
    if (Math.abs(phq4Correlation) > 0.6) {
      significantFindings.push(`Strong correlation with depression screening (${(phq4Correlation * 100).toFixed(0)}%)`);
    }
    if (Math.abs(gad7Correlation) > 0.6) {
      significantFindings.push(`Strong correlation with anxiety assessment (${(gad7Correlation * 100).toFixed(0)}%)`);
    }

    const trendDirection = trends.find(t => t.period === 'weekly')?.direction || 'stable';

    return {
      userId,
      exportDate: new Date(),
      timeRange: {
        start: startDate || (entries.length > 0 ? entries[entries.length - 1].timestamp : new Date()),
        end: endDate || (entries.length > 0 ? entries[0].timestamp : new Date())
      },
      summary: {
        totalEntries: entries.length,
        averageMood,
        moodRange,
        trendDirection,
        commonTags,
        voiceNoteCount: entries.filter(e => e.voiceNote).length
      },
      entries,
      trends,
      patterns,
      correlations,
      insights,
      assessmentCorrelations: {
        phq4Correlation,
        gad7Correlation,
        significantFindings
      }
    };
  }

  /**
   * Analyze user mood data and generate insights
   */
  private async analyzeUserMood(userId: string): Promise<void> {
    try {
      await this.generateInsights(userId);
      this.identifyMoodPatterns(userId);
      
      this.emit('analysis:completed', { 
        userId, 
        timestamp: new Date(),
        insights: this.getUserInsights(userId)
      });
    } catch (error) {
      this.emit('analysis:error', { userId, error });
    }
  }

  /**
   * Get analytics summary for a user
   */
  getAnalyticsSummary(userId: string) {
    const entries = this.getMoodEntries(userId);
    const insights = this.getUserInsights(userId);
    const trends = this.calculateMoodTrends(userId);
    const patterns = this.identifyMoodPatterns(userId);

    return {
      entriesCount: entries.length,
      insightsCount: insights.length,
      trendsCount: trends.length,
      patternsCount: patterns.length,
      lastEntry: entries[0]?.timestamp,
      averageMood: entries.length > 0 
        ? entries.reduce((sum, e) => sum + e.moodScore, 0) / entries.length 
        : 0
    };
  }
}

// Export singleton instance
export const moodAnalyticsEngine = new MoodAnalyticsEngine();
export default MoodAnalyticsEngine;
