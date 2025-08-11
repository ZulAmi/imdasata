/**
 * SATA Automated Reporting Engine
 * Generates comprehensive mental health reports and analytics
 */

import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportData {
  id: string;
  type: 'weekly' | 'monthly' | 'resource-gap' | 'user-journey' | 'intervention' | 'compliance';
  title: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  data: any;
  insights: string[];
  recommendations: string[];
}

interface MentalHealthTrend {
  date: string;
  avgMoodScore: number;
  assessmentCompletions: number;
  highRiskUsers: number;
  interventions: number;
  resourceViews: number;
}

interface ResourceGap {
  category: string;
  demandScore: number;
  availabilityScore: number;
  gapPercentage: number;
  recommendedActions: string[];
}

interface UserJourney {
  stage: string;
  userCount: number;
  avgDuration: number;
  dropoffRate: number;
  conversionRate: number;
  keyActions: string[];
}

interface InterventionEffectiveness {
  type: string;
  totalInterventions: number;
  successRate: number;
  avgResponseTime: number;
  userSatisfaction: number;
  outcomes: {
    improved: number;
    stable: number;
    declined: number;
  };
}

interface ComplianceMetric {
  area: string;
  status: 'compliant' | 'warning' | 'violation';
  score: number;
  lastAudit: Date;
  issues: string[];
  mitigationSteps: string[];
}

export default function ReportingEngine() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [reportType, setReportType] = useState<string>('weekly');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Mock data generators (in production, these would fetch from APIs)
  const generateMentalHealthTrends = (startDate: Date, endDate: Date): MentalHealthTrend[] => {
    const trends: MentalHealthTrend[] = [];
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      trends.push({
        date: date.toISOString().split('T')[0],
        avgMoodScore: 3.2 + Math.random() * 1.6, // 3.2-4.8 range
        assessmentCompletions: Math.floor(15 + Math.random() * 25),
        highRiskUsers: Math.floor(2 + Math.random() * 8),
        interventions: Math.floor(5 + Math.random() * 15),
        resourceViews: Math.floor(50 + Math.random() * 100)
      });
    }
    return trends;
  };

  const generateResourceGapAnalysis = (): ResourceGap[] => [
    {
      category: 'Crisis Intervention',
      demandScore: 85,
      availabilityScore: 60,
      gapPercentage: 29.4,
      recommendedActions: [
        'Expand 24/7 crisis hotline capacity',
        'Add more crisis counselors',
        'Implement automated crisis detection'
      ]
    },
    {
      category: 'Anxiety Management',
      demandScore: 92,
      availabilityScore: 75,
      gapPercentage: 18.5,
      recommendedActions: [
        'Develop self-guided anxiety modules',
        'Partner with anxiety specialists',
        'Create peer support groups'
      ]
    },
    {
      category: 'Depression Support',
      demandScore: 88,
      availabilityScore: 70,
      gapPercentage: 20.4,
      recommendedActions: [
        'Expand therapy appointment availability',
        'Add depression screening tools',
        'Implement mood tracking features'
      ]
    },
    {
      category: 'Student Academic Stress',
      demandScore: 95,
      availabilityScore: 45,
      gapPercentage: 52.6,
      recommendedActions: [
        'Create academic stress management program',
        'Add study skills resources',
        'Implement exam period support services'
      ]
    }
  ];

  const generateUserJourneyInsights = (): UserJourney[] => [
    {
      stage: 'Registration',
      userCount: 1247,
      avgDuration: 3.5,
      dropoffRate: 12.3,
      conversionRate: 87.7,
      keyActions: ['Email verification', 'Profile setup', 'Privacy consent']
    },
    {
      stage: 'Onboarding',
      userCount: 1094,
      avgDuration: 8.2,
      dropoffRate: 18.5,
      conversionRate: 81.5,
      keyActions: ['Initial assessment', 'Goal setting', 'Feature tour']
    },
    {
      stage: 'First Assessment',
      userCount: 892,
      avgDuration: 12.5,
      dropoffRate: 24.1,
      conversionRate: 75.9,
      keyActions: ['PHQ-4 completion', 'GAD-7 completion', 'Mood baseline']
    },
    {
      stage: 'Active Engagement',
      userCount: 677,
      avgDuration: 45.3,
      dropoffRate: 31.2,
      conversionRate: 68.8,
      keyActions: ['Daily mood logging', 'Resource viewing', 'Assessment retakes']
    },
    {
      stage: 'Long-term Use',
      userCount: 466,
      avgDuration: 120.8,
      dropoffRate: 42.5,
      conversionRate: 57.5,
      keyActions: ['Trend analysis', 'Goal achievement', 'Referral acceptance']
    }
  ];

  const generateInterventionEffectiveness = (): InterventionEffectiveness[] => [
    {
      type: 'Automated Crisis Alert',
      totalInterventions: 156,
      successRate: 78.2,
      avgResponseTime: 3.5,
      userSatisfaction: 4.2,
      outcomes: { improved: 122, stable: 28, declined: 6 }
    },
    {
      type: 'Mood Tracking Nudges',
      totalInterventions: 2340,
      successRate: 65.8,
      avgResponseTime: 0.5,
      userSatisfaction: 3.8,
      outcomes: { improved: 1540, stable: 680, declined: 120 }
    },
    {
      type: 'Resource Recommendations',
      totalInterventions: 1876,
      successRate: 71.3,
      avgResponseTime: 1.2,
      userSatisfaction: 4.1,
      outcomes: { improved: 1337, stable: 463, declined: 76 }
    },
    {
      type: 'Peer Support Connections',
      totalInterventions: 432,
      successRate: 82.4,
      avgResponseTime: 24.5,
      userSatisfaction: 4.5,
      outcomes: { improved: 356, stable: 64, declined: 12 }
    }
  ];

  const generateComplianceMetrics = (): ComplianceMetric[] => [
    {
      area: 'Data Privacy (HIPAA)',
      status: 'compliant',
      score: 96.8,
      lastAudit: new Date('2024-07-15'),
      issues: [],
      mitigationSteps: ['Regular privacy training', 'Quarterly audits']
    },
    {
      area: 'User Consent Management',
      status: 'compliant',
      score: 94.2,
      lastAudit: new Date('2024-08-01'),
      issues: ['Minor consent form updates needed'],
      mitigationSteps: ['Update consent forms', 'Implement granular consent options']
    },
    {
      area: 'Data Encryption',
      status: 'compliant',
      score: 98.5,
      lastAudit: new Date('2024-07-30'),
      issues: [],
      mitigationSteps: ['Continue encryption monitoring', 'Regular security updates']
    },
    {
      area: 'Access Control',
      status: 'warning',
      score: 87.3,
      lastAudit: new Date('2024-08-05'),
      issues: ['Some admin accounts lack MFA', 'Password policy updates needed'],
      mitigationSteps: ['Enforce MFA for all admin accounts', 'Update password requirements']
    },
    {
      area: 'Audit Logging',
      status: 'compliant',
      score: 92.1,
      lastAudit: new Date('2024-08-08'),
      issues: ['Log retention policy needs clarification'],
      mitigationSteps: ['Clarify log retention periods', 'Implement automated log archival']
    }
  ];

  const generateReport = async (type: string) => {
    setIsGenerating(true);
    
    try {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      let reportData: ReportData;

      switch (type) {
        case 'weekly':
        case 'monthly':
          const trends = generateMentalHealthTrends(startDate, endDate);
          const avgMood = trends.reduce((sum, t) => sum + t.avgMoodScore, 0) / trends.length;
          const totalAssessments = trends.reduce((sum, t) => sum + t.assessmentCompletions, 0);
          const totalHighRisk = trends.reduce((sum, t) => sum + t.highRiskUsers, 0);
          
          reportData = {
            id: `mental-health-${type}-${Date.now()}`,
            type: type as any,
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} Mental Health Trends Report`,
            generatedAt: new Date(),
            period: { start: startDate, end: endDate },
            data: {
              trends,
              summary: {
                avgMoodScore: avgMood,
                totalAssessments,
                totalHighRiskUsers: totalHighRisk,
                trendDirection: avgMood > 3.5 ? 'improving' : avgMood < 3.0 ? 'declining' : 'stable'
              }
            },
            insights: [
              `Average mood score: ${avgMood.toFixed(2)} (${avgMood > 3.5 ? 'Good' : avgMood > 2.5 ? 'Fair' : 'Concerning'})`,
              `${totalAssessments} assessments completed during period`,
              `${totalHighRisk} high-risk users identified requiring intervention`,
              `${trends.filter(t => t.avgMoodScore > 4.0).length} days with above-average mood scores`
            ],
            recommendations: [
              totalHighRisk > 50 ? 'Consider expanding crisis intervention resources' : 'Maintain current crisis response protocols',
              avgMood < 3.0 ? 'Implement additional mood improvement programs' : 'Continue current mental health initiatives',
              'Increase assessment completion rates through targeted reminders',
              'Develop predictive models for early intervention'
            ]
          };
          break;

        case 'resource-gap':
          const gaps = generateResourceGapAnalysis();
          reportData = {
            id: `resource-gap-${Date.now()}`,
            type: 'resource-gap',
            title: 'Resource Gap Analysis Report',
            generatedAt: new Date(),
            period: { start: startDate, end: endDate },
            data: { gaps },
            insights: [
              `${gaps.filter(g => g.gapPercentage > 30).length} critical resource gaps identified`,
              `Student Academic Stress shows highest gap at ${gaps.find(g => g.category === 'Student Academic Stress')?.gapPercentage}%`,
              `Crisis Intervention requires immediate attention`,
              `Overall resource utilization efficiency: ${((gaps.reduce((sum, g) => sum + g.availabilityScore, 0) / gaps.length)).toFixed(1)}%`
            ],
            recommendations: [
              'Prioritize Student Academic Stress resources for next quarter',
              'Expand crisis intervention capacity by 40%',
              'Develop automated resource matching algorithms',
              'Partner with external mental health providers'
            ]
          };
          break;

        case 'user-journey':
          const journeys = generateUserJourneyInsights();
          reportData = {
            id: `user-journey-${Date.now()}`,
            type: 'user-journey',
            title: 'User Journey and Behavior Pattern Insights',
            generatedAt: new Date(),
            period: { start: startDate, end: endDate },
            data: { journeys },
            insights: [
              `Highest dropoff at ${journeys.reduce((max, j) => j.dropoffRate > max.dropoffRate ? j : max).stage} stage (${journeys.reduce((max, j) => j.dropoffRate > max.dropoffRate ? j : max).dropoffRate}%)`,
              `${journeys[journeys.length - 1].userCount} users achieved long-term engagement`,
              `Average user journey completion time: ${journeys.reduce((sum, j) => sum + j.avgDuration, 0) / journeys.length} minutes`,
              `Overall conversion to active use: ${journeys.find(j => j.stage === 'Active Engagement')?.conversionRate}%`
            ],
            recommendations: [
              'Simplify onboarding process to reduce early dropoff',
              'Add gamification elements to improve engagement',
              'Implement personalized user journey optimization',
              'Create targeted retention campaigns for each stage'
            ]
          };
          break;

        case 'intervention':
          const interventions = generateInterventionEffectiveness();
          const overallSuccess = interventions.reduce((sum, i) => sum + i.successRate, 0) / interventions.length;
          reportData = {
            id: `intervention-${Date.now()}`,
            type: 'intervention',
            title: 'Intervention Effectiveness Measurements',
            generatedAt: new Date(),
            period: { start: startDate, end: endDate },
            data: { interventions },
            insights: [
              `Overall intervention success rate: ${overallSuccess.toFixed(1)}%`,
              `Peer Support Connections show highest success at ${interventions.find(i => i.type === 'Peer Support Connections')?.successRate}%`,
              `${interventions.reduce((sum, i) => sum + i.totalInterventions, 0)} total interventions delivered`,
              `Average user satisfaction: ${(interventions.reduce((sum, i) => sum + i.userSatisfaction, 0) / interventions.length).toFixed(1)}/5.0`
            ],
            recommendations: [
              'Expand peer support program due to high effectiveness',
              'Optimize automated crisis response timing',
              'Develop personalized intervention algorithms',
              'Implement real-time intervention effectiveness tracking'
            ]
          };
          break;

        case 'compliance':
          const compliance = generateComplianceMetrics();
          const avgScore = compliance.reduce((sum, c) => sum + c.score, 0) / compliance.length;
          reportData = {
            id: `compliance-${Date.now()}`,
            type: 'compliance',
            title: 'Compliance and Privacy Audit Report',
            generatedAt: new Date(),
            period: { start: startDate, end: endDate },
            data: { compliance },
            insights: [
              `Overall compliance score: ${avgScore.toFixed(1)}%`,
              `${compliance.filter(c => c.status === 'compliant').length}/${compliance.length} areas fully compliant`,
              `${compliance.filter(c => c.status === 'warning').length} areas require attention`,
              `${compliance.reduce((sum, c) => sum + c.issues.length, 0)} total issues identified`
            ],
            recommendations: [
              'Address access control warnings immediately',
              'Implement MFA for all administrative accounts',
              'Update password policies to current standards',
              'Schedule quarterly compliance reviews'
            ]
          };
          break;

        default:
          throw new Error('Invalid report type');
      }

      setReports(prev => [reportData, ...prev]);
      setSelectedReport(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToExcel = (report: ReportData) => {
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Report Title', report.title],
      ['Generated At', report.generatedAt.toLocaleString()],
      ['Period Start', report.period.start.toLocaleDateString()],
      ['Period End', report.period.end.toLocaleDateString()],
      [''],
      ['Key Insights', ''],
      ...report.insights.map(insight => ['', insight]),
      [''],
      ['Recommendations', ''],
      ...report.recommendations.map(rec => ['', rec])
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Data sheet based on report type
    if (report.type === 'weekly' || report.type === 'monthly') {
      const trendsWs = XLSX.utils.json_to_sheet(report.data.trends);
      XLSX.utils.book_append_sheet(wb, trendsWs, 'Trends Data');
    } else if (report.type === 'resource-gap') {
      const gapsWs = XLSX.utils.json_to_sheet(report.data.gaps);
      XLSX.utils.book_append_sheet(wb, gapsWs, 'Resource Gaps');
    } else if (report.type === 'user-journey') {
      const journeyWs = XLSX.utils.json_to_sheet(report.data.journeys);
      XLSX.utils.book_append_sheet(wb, journeyWs, 'User Journey');
    } else if (report.type === 'intervention') {
      const interventionWs = XLSX.utils.json_to_sheet(report.data.interventions);
      XLSX.utils.book_append_sheet(wb, interventionWs, 'Interventions');
    } else if (report.type === 'compliance') {
      const complianceWs = XLSX.utils.json_to_sheet(report.data.compliance);
      XLSX.utils.book_append_sheet(wb, complianceWs, 'Compliance');
    }
    
    const fileName = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportToPDF = (report: ReportData) => {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(report.title, 20, yPosition);
    yPosition += 20;
    
    // Report details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${report.generatedAt.toLocaleString()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Period: ${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()}`, 20, yPosition);
    yPosition += 20;
    
    // Key Insights
    doc.setFont('helvetica', 'bold');
    doc.text('Key Insights:', 20, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'normal');
    
    report.insights.forEach(insight => {
      const lines = doc.splitTextToSize(`• ${insight}`, 170);
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 25, yPosition);
        yPosition += 7;
      });
    });
    
    yPosition += 10;
    
    // Recommendations
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations:', 20, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'normal');
    
    report.recommendations.forEach(rec => {
      const lines = doc.splitTextToSize(`• ${rec}`, 170);
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 25, yPosition);
        yPosition += 7;
      });
    });
    
    const fileName = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const exportToPresentation = (report: ReportData) => {
    // Create a simple HTML presentation export
    const presentationHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .slide { background: white; padding: 40px; margin: 20px 0; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); page-break-after: always; }
          .title-slide h1 { color: #2563eb; font-size: 2.5em; margin-bottom: 20px; }
          .content-slide h2 { color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
          .insight-item, .rec-item { margin: 15px 0; padding: 15px; background: #f8fafc; border-left: 4px solid #3b82f6; }
          .metrics { display: flex; justify-content: space-around; margin: 20px 0; }
          .metric { text-align: center; padding: 20px; background: #dbeafe; border-radius: 10px; }
          .metric-value { font-size: 2em; font-weight: bold; color: #1e40af; }
        </style>
      </head>
      <body>
        <div class="slide title-slide">
          <h1>${report.title}</h1>
          <p><strong>Generated:</strong> ${report.generatedAt.toLocaleString()}</p>
          <p><strong>Period:</strong> ${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()}</p>
          <p><strong>Report ID:</strong> ${report.id}</p>
        </div>
        
        <div class="slide content-slide">
          <h2>Key Insights</h2>
          ${report.insights.map(insight => `<div class="insight-item">${insight}</div>`).join('')}
        </div>
        
        <div class="slide content-slide">
          <h2>Recommendations</h2>
          ${report.recommendations.map(rec => `<div class="rec-item">${rec}</div>`).join('')}
        </div>
        
        <div class="slide content-slide">
          <h2>Executive Summary</h2>
          <p>This ${report.type} report provides comprehensive analysis of mental health trends, user engagement, and system performance for the SATA platform.</p>
          <p>Key findings indicate areas for improvement and strategic opportunities to enhance user outcomes and system effectiveness.</p>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([presentationHTML], { type: 'text/html' });
    const fileName = `${report.title.replace(/\s+/g, '_')}_Presentation_${new Date().toISOString().split('T')[0]}.html`;
    saveAs(blob, fileName);
  };

  const scheduleAutomatedReport = (type: string, frequency: 'weekly' | 'monthly') => {
    // In production, this would configure actual scheduled reports
    alert(`Automated ${frequency} ${type} reports have been scheduled. You will receive notifications when reports are generated.`);
  };

  useEffect(() => {
    // Load existing reports on component mount
    // In production, this would fetch from an API
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 SATA Reporting Engine</h1>
              <p className="text-gray-600">Automated mental health analytics and compliance reporting</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last Updated: {new Date().toLocaleString()}
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                System Active
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Generation Panel */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generate New Report</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="weekly">Weekly Mental Health Trends</option>
                  <option value="monthly">Monthly Mental Health Trends</option>
                  <option value="resource-gap">Resource Gap Analysis</option>
                  <option value="user-journey">User Journey Insights</option>
                  <option value="intervention">Intervention Effectiveness</option>
                  <option value="compliance">Compliance & Privacy Audit</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <button
                onClick={() => generateReport(reportType)}
                disabled={isGenerating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin text-lg">⚡</div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  '📈 Generate Report'
                )}
              </button>
            </div>

            {/* Automated Scheduling */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Automated Reports</h3>
              <div className="space-y-2">
                <button
                  onClick={() => scheduleAutomatedReport('mental-health', 'weekly')}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">Weekly Trends</div>
                  <div className="text-sm text-gray-600">Auto-generate every Monday</div>
                </button>
                <button
                  onClick={() => scheduleAutomatedReport('compliance', 'monthly')}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">Monthly Compliance</div>
                  <div className="text-sm text-gray-600">Auto-generate 1st of month</div>
                </button>
              </div>
            </div>
          </div>

          {/* Report List */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Reports</h2>
            
            {reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>No reports generated yet</p>
                <p className="text-sm">Generate your first report to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedReport?.id === report.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm mb-1">
                          {report.title}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {report.generatedAt.toLocaleDateString()}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            report.type === 'compliance' ? 'bg-green-100 text-green-800' :
                            report.type === 'resource-gap' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {report.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            {selectedReport ? (
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedReport.title}</h2>
                    <p className="text-gray-600 text-sm">
                      Generated {selectedReport.generatedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => exportToExcel(selectedReport)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      title="Export to Excel"
                    >
                      📊 Excel
                    </button>
                    <button
                      onClick={() => exportToPDF(selectedReport)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      title="Export to PDF"
                    >
                      📄 PDF
                    </button>
                    <button
                      onClick={() => exportToPresentation(selectedReport)}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                      title="Export for Presentation"
                    >
                      🎯 Slides
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Key Insights */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">🔍 Key Insights</h3>
                    <div className="space-y-2">
                      {selectedReport.insights.map((insight, index) => (
                        <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-3 text-sm">
                          {insight}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Recommendations</h3>
                    <div className="space-y-2">
                      {selectedReport.recommendations.map((rec, index) => (
                        <div key={index} className="bg-green-50 border-l-4 border-green-500 p-3 text-sm">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Report Period */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Report Period</h4>
                    <p className="text-sm text-gray-600">
                      {selectedReport.period.start.toLocaleDateString()} - {selectedReport.period.end.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Report ID: {selectedReport.id}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Report</h3>
                <p className="text-sm">Choose a report from the list to view details and export options</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
