import { NextApiRequest, NextApiResponse } from 'next';
import { PHQ4Analytics, PHQ4AnalyticsData } from '../../../lib/phq4-analytics';

// Mock data for demonstration - in production, this would come from your database
const generateMockData = (): PHQ4AnalyticsData[] => {
  const countries = ['Bangladesh', 'India', 'Philippines', 'Indonesia', 'Myanmar', 'Thailand', 'Vietnam', 'Nepal', 'Sri Lanka'];
  const languages = ['en', 'zh', 'bn', 'ta', 'my', 'idn'];
  const ageGroups = ['18-25', '26-35', '36-45', '46-55', '55+'];
  const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const employmentSectors = ['Construction', 'Domestic Work', 'Manufacturing', 'Healthcare', 'Hospitality', 'Agriculture'];
  const riskLevels: ('minimal' | 'mild' | 'moderate' | 'severe')[] = ['minimal', 'mild', 'moderate', 'severe'];

  const mockData: PHQ4AnalyticsData[] = [];
  
  // Generate 500 mock assessments over the last 90 days
  for (let i = 0; i < 500; i++) {
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 90));
    
    const q1 = Math.floor(Math.random() * 4);
    const q2 = Math.floor(Math.random() * 4);
    const q3 = Math.floor(Math.random() * 4);
    const q4 = Math.floor(Math.random() * 4);
    const totalScore = q1 + q2 + q3 + q4;
    
    let riskLevel: 'minimal' | 'mild' | 'moderate' | 'severe';
    if (totalScore >= 9) riskLevel = 'severe';
    else if (totalScore >= 6) riskLevel = 'moderate';
    else if (totalScore >= 3) riskLevel = 'mild';
    else riskLevel = 'minimal';

    const isComplete = Math.random() > 0.15; // 85% completion rate
    
    mockData.push({
      id: `assessment_${i}`,
      anonymousId: `anon_${Math.random().toString(36).substr(2, 9)}`,
      totalScore,
      depressionScore: q1 + q2,
      anxietyScore: q3 + q4,
      riskLevel,
      language: languages[Math.floor(Math.random() * languages.length)],
      countryOfOrigin: countries[Math.floor(Math.random() * countries.length)],
      ageGroup: ageGroups[Math.floor(Math.random() * ageGroups.length)],
      gender: genders[Math.floor(Math.random() * genders.length)],
      employmentSector: employmentSectors[Math.floor(Math.random() * employmentSectors.length)],
      timestamp: randomDate.toISOString(),
      completionTime: isComplete ? Math.floor(Math.random() * 180) + 30 : undefined,
      isComplete
    });
  }

  return mockData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      type, 
      startDate, 
      endDate, 
      includeMetadata,
      country,
      language 
    } = req.query;

    // In production, fetch from database
    let data = generateMockData();

    // Apply filters
    if (startDate && endDate) {
      data = data.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= new Date(startDate as string) && 
               itemDate <= new Date(endDate as string);
      });
    }

    if (country) {
      data = data.filter(item => item.countryOfOrigin === country);
    }

    if (language) {
      data = data.filter(item => item.language === language);
    }

    const analytics = new PHQ4Analytics(data);

    switch (type) {
      case 'population-trends':
        const trends = analytics.calculatePopulationTrends(
          startDate && endDate ? { 
            start: startDate as string, 
            end: endDate as string 
          } : undefined
        );
        return res.status(200).json(trends);

      case 'demographic-breakdown':
        const demographics = analytics.generateDemographicBreakdown();
        return res.status(200).json(demographics);

      case 'completion-metrics':
        const completion = analytics.trackCompletionMetrics();
        return res.status(200).json(completion);

      case 'high-risk-patterns':
        const patterns = analytics.identifyHighRiskPatterns();
        return res.status(200).json(patterns);

      case 'visualization-data':
        const visualizations = analytics.createVisualizationData();
        return res.status(200).json(visualizations);

      case 'export-data':
        const exportData = analytics.exportAnonymizedData(
          includeMetadata === 'true'
        );
        
        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition', 
          `attachment; filename="phq4-export-${new Date().toISOString().split('T')[0]}.json"`
        );
        return res.status(200).json(exportData);

      case 'dashboard-summary':
        // Combined data for dashboard overview
        const summary = {
          trends: analytics.calculatePopulationTrends(),
          demographics: analytics.generateDemographicBreakdown(),
          completion: analytics.trackCompletionMetrics(),
          patterns: analytics.identifyHighRiskPatterns(),
          visualizations: analytics.createVisualizationData()
        };
        return res.status(200).json(summary);

      default:
        return res.status(400).json({ 
          error: 'Invalid type parameter. Supported types: population-trends, demographic-breakdown, completion-metrics, high-risk-patterns, visualization-data, export-data, dashboard-summary' 
        });
    }

  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}

// Additional utility functions for data processing
export const processRealTimeMetrics = (data: PHQ4AnalyticsData[]) => {
  const now = new Date();
  const last24Hours = data.filter(item => {
    const itemDate = new Date(item.timestamp);
    return now.getTime() - itemDate.getTime() <= 24 * 60 * 60 * 1000;
  });

  const last7Days = data.filter(item => {
    const itemDate = new Date(item.timestamp);
    return now.getTime() - itemDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
  });

  return {
    last24Hours: {
      total: last24Hours.length,
      completed: last24Hours.filter(item => item.isComplete).length,
      highRisk: last24Hours.filter(item => 
        item.isComplete && (item.riskLevel === 'severe' || item.riskLevel === 'moderate')
      ).length
    },
    last7Days: {
      total: last7Days.length,
      completed: last7Days.filter(item => item.isComplete).length,
      averageScore: last7Days.filter(item => item.isComplete).length > 0 
        ? last7Days
            .filter(item => item.isComplete)
            .reduce((sum, item) => sum + item.totalScore, 0) / 
          last7Days.filter(item => item.isComplete).length
        : 0
    }
  };
};

export const generateAlerts = (data: PHQ4AnalyticsData[]) => {
  const analytics = new PHQ4Analytics(data);
  const patterns = analytics.identifyHighRiskPatterns();
  
  const alerts = [];

  // High risk percentage alert
  if (patterns.highRiskPercentage > 30) {
    alerts.push({
      type: 'warning',
      title: 'High Risk Population Alert',
      message: `${patterns.highRiskPercentage.toFixed(1)}% of recent assessments indicate high risk levels`,
      priority: 'high',
      timestamp: new Date().toISOString()
    });
  }

  // Immediate intervention needed
  if (patterns.interventionTriggers.immediateIntervention.length > 0) {
    alerts.push({
      type: 'critical',
      title: 'Immediate Intervention Required',
      message: `${patterns.interventionTriggers.immediateIntervention.length} users require immediate mental health intervention`,
      priority: 'critical',
      timestamp: new Date().toISOString()
    });
  }

  // Completion rate alert
  const completion = analytics.trackCompletionMetrics();
  if (completion.overallCompletionRate < 70) {
    alerts.push({
      type: 'info',
      title: 'Low Completion Rate',
      message: `Assessment completion rate is ${completion.overallCompletionRate.toFixed(1)}% - consider UX improvements`,
      priority: 'medium',
      timestamp: new Date().toISOString()
    });
  }

  return alerts;
};
