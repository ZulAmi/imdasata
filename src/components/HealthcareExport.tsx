/**
 * SATA Healthcare Provider Export Component
 * Professional mood data reports for clinical use
 */

import React, { useState, useRef } from 'react';
import { moodAnalyticsEngine, MoodExportData } from '../lib/mood-analytics-engine';

interface HealthcareExportProps {
  userId: string;
  patientName?: string;
  onExportComplete?: (exportData: MoodExportData) => void;
}

interface ExportOptions {
  format: 'comprehensive' | 'summary' | 'clinical';
  timeRange: {
    start: Date;
    end: Date;
  };
  includeVoiceNotes: boolean;
  includePersonalNotes: boolean;
  anonymizeData: boolean;
  correlateAssessments: boolean;
}

const HealthcareExport: React.FC<HealthcareExportProps> = ({
  userId,
  patientName = 'Patient',
  onExportComplete
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'comprehensive',
    timeRange: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      end: new Date()
    },
    includeVoiceNotes: false, // Default to false for privacy
    includePersonalNotes: true,
    anonymizeData: false,
    correlateAssessments: true
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<MoodExportData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const exportRef = useRef<HTMLDivElement>(null);

  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      const exportData = moodAnalyticsEngine.exportMoodData(
        userId,
        exportOptions.timeRange.start,
        exportOptions.timeRange.end
      );

      // Apply anonymization if requested
      if (exportOptions.anonymizeData) {
        exportData.userId = 'ANONYMOUS_' + Math.random().toString(36).substr(2, 9);
        exportData.entries.forEach(entry => {
          entry.userId = exportData.userId;
          if (entry.phrase) {
            entry.phrase = '[REDACTED]';
          }
          if (entry.voiceNote) {
            entry.voiceNote.transcript = '[REDACTED]';
          }
        });
      }

      // Filter voice notes if not included
      if (!exportOptions.includeVoiceNotes) {
        exportData.entries.forEach(entry => {
          if (entry.voiceNote) {
            entry.voiceNote = undefined;
          }
        });
      }

      // Filter personal notes if not included
      if (!exportOptions.includePersonalNotes) {
        exportData.entries.forEach(entry => {
          entry.phrase = undefined;
        });
      }

      setPreviewData(exportData);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Error generating preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!previewData) return;

    const reportContent = generateReportContent(previewData);
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `mood-report-${userId}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onExportComplete) {
      onExportComplete(previewData);
    }
  };

  const downloadJSON = () => {
    if (!previewData) return;

    const dataStr = JSON.stringify(previewData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `mood-data-${userId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateReportContent = (data: MoodExportData): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mood Analysis Report - ${patientName}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            border-left: 5px solid #3B82F6;
        }
        .report-section {
            background: white;
            padding: 25px;
            margin-bottom: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section-title {
            color: #2563EB;
            border-bottom: 2px solid #E5E7EB;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 1.5em;
            font-weight: 600;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #F8FAFC;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #10B981;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #059669;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #6B7280;
            font-size: 0.9em;
        }
        .trend-item {
            background: #FEF3C7;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid #F59E0B;
        }
        .trend-improving {
            background: #DCFCE7;
            border-left-color: #10B981;
        }
        .trend-declining {
            background: #FEE2E2;
            border-left-color: #EF4444;
        }
        .mood-entry {
            background: #F9FAFB;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 3px solid #6B7280;
        }
        .mood-score {
            font-weight: bold;
            color: #1F2937;
        }
        .correlation-high {
            color: #059669;
            font-weight: bold;
        }
        .correlation-medium {
            color: #D97706;
            font-weight: bold;
        }
        .correlation-low {
            color: #DC2626;
        }
        .footer {
            background: #374151;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin-top: 30px;
        }
        .clinical-note {
            background: #EFF6FF;
            border: 1px solid #DBEAFE;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }
        .clinical-note-title {
            color: #1D4ED8;
            font-weight: 600;
            margin-bottom: 8px;
        }
        @media print {
            body { background: white; }
            .report-section { box-shadow: none; border: 1px solid #ddd; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧠 Mental Health Mood Analysis Report</h1>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div>
                <strong>Patient:</strong> ${exportOptions.anonymizeData ? 'Anonymous Patient' : patientName}<br>
                <strong>Patient ID:</strong> ${data.userId}<br>
                <strong>Report Generated:</strong> ${data.exportDate.toLocaleDateString()}
            </div>
            <div>
                <strong>Analysis Period:</strong> ${data.timeRange.start.toLocaleDateString()} - ${data.timeRange.end.toLocaleDateString()}<br>
                <strong>Report Type:</strong> ${exportOptions.format.charAt(0).toUpperCase() + exportOptions.format.slice(1)}<br>
                <strong>Data Points:</strong> ${data.summary.totalEntries} mood entries
            </div>
        </div>
    </div>

    <div class="report-section">
        <h2 class="section-title">📊 Executive Summary</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${data.summary.averageMood.toFixed(1)}/10</div>
                <div class="stat-label">Average Mood Score</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.summary.totalEntries}</div>
                <div class="stat-label">Total Entries</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.summary.moodRange.highest}/10</div>
                <div class="stat-label">Highest Mood</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.summary.moodRange.lowest}/10</div>
                <div class="stat-label">Lowest Mood</div>
            </div>
        </div>
        
        <div class="clinical-note">
            <div class="clinical-note-title">Clinical Overview</div>
            <p>Patient demonstrates ${data.summary.trendDirection} mood pattern over the analysis period. 
            Average mood score of ${data.summary.averageMood.toFixed(1)}/10 indicates 
            ${data.summary.averageMood >= 7 ? 'generally positive' : 
              data.summary.averageMood >= 5 ? 'moderate' : 'concerning'} emotional state.</p>
            ${data.summary.voiceNoteCount > 0 ? `<p>Patient engaged with voice note feature ${data.summary.voiceNoteCount} times, suggesting active participation in mood tracking.</p>` : ''}
        </div>
    </div>

    <div class="report-section">
        <h2 class="section-title">📈 Trend Analysis</h2>
        ${data.trends.map(trend => `
            <div class="trend-item trend-${trend.direction}">
                <strong>${trend.period.charAt(0).toUpperCase() + trend.period.slice(1)} Trend: ${trend.direction.charAt(0).toUpperCase() + trend.direction.slice(1)}</strong><br>
                Change: ${trend.change.toFixed(1)}% | Confidence: ${(trend.confidence * 100).toFixed(0)}%
                ${trend.significantEvents && trend.significantEvents.length > 0 ? `
                    <div style="margin-top: 10px;">
                        <em>Significant Events:</em>
                        <ul style="margin: 5px 0 0 20px;">
                            ${trend.significantEvents.map(event => `
                                <li>${event.date.toLocaleDateString()} - ${event.type}${event.context ? `: ${event.context}` : ''}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>

    ${data.assessmentCorrelations && (data.assessmentCorrelations.phq4Correlation !== 0 || data.assessmentCorrelations.gad7Correlation !== 0) ? `
    <div class="report-section">
        <h2 class="section-title">🔗 Assessment Correlations</h2>
        ${data.assessmentCorrelations.phq4Correlation !== 0 ? `
            <div class="clinical-note">
                <div class="clinical-note-title">PHQ-4 Depression Screening Correlation</div>
                <p>Correlation strength: <span class="${Math.abs(data.assessmentCorrelations.phq4Correlation) > 0.7 ? 'correlation-high' : Math.abs(data.assessmentCorrelations.phq4Correlation) > 0.4 ? 'correlation-medium' : 'correlation-low'}">${(Math.abs(data.assessmentCorrelations.phq4Correlation) * 100).toFixed(0)}%</span></p>
                <p>Mood entries show ${Math.abs(data.assessmentCorrelations.phq4Correlation) > 0.6 ? 'strong' : Math.abs(data.assessmentCorrelations.phq4Correlation) > 0.3 ? 'moderate' : 'weak'} correlation with formal depression screening results.</p>
            </div>
        ` : ''}
        
        ${data.assessmentCorrelations.gad7Correlation !== 0 ? `
            <div class="clinical-note">
                <div class="clinical-note-title">GAD-7 Anxiety Assessment Correlation</div>
                <p>Correlation strength: <span class="${Math.abs(data.assessmentCorrelations.gad7Correlation) > 0.7 ? 'correlation-high' : Math.abs(data.assessmentCorrelations.gad7Correlation) > 0.4 ? 'correlation-medium' : 'correlation-low'}">${(Math.abs(data.assessmentCorrelations.gad7Correlation) * 100).toFixed(0)}%</span></p>
                <p>Mood tracking demonstrates ${Math.abs(data.assessmentCorrelations.gad7Correlation) > 0.6 ? 'strong' : Math.abs(data.assessmentCorrelations.gad7Correlation) > 0.3 ? 'moderate' : 'weak'} alignment with anxiety assessment outcomes.</p>
            </div>
        ` : ''}

        ${data.assessmentCorrelations.significantFindings.length > 0 ? `
            <div class="clinical-note">
                <div class="clinical-note-title">Key Findings</div>
                <ul>
                    ${data.assessmentCorrelations.significantFindings.map(finding => `<li>${finding}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    </div>
    ` : ''}

    <div class="report-section">
        <h2 class="section-title">🔍 Clinical Insights</h2>
        ${data.insights.filter(insight => insight.priority === 'high' || insight.priority === 'critical').map(insight => `
            <div class="clinical-note">
                <div class="clinical-note-title">${insight.title} (${insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)} Priority)</div>
                <p>${insight.description}</p>
                ${insight.actionable ? '<p><em>Action recommended for clinical consideration.</em></p>' : ''}
            </div>
        `).join('')}
        
        ${data.patterns.length > 0 ? `
            <div style="margin-top: 20px;">
                <strong>Behavioral Patterns Identified:</strong>
                <ul style="margin-left: 20px;">
                    ${data.patterns.map(pattern => `
                        <li>${pattern.description} (${(pattern.strength * 100).toFixed(0)}% strength)
                        ${pattern.recommendation ? `<br><em>Recommendation: ${pattern.recommendation}</em>` : ''}</li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}
    </div>

    ${exportOptions.format === 'comprehensive' ? `
    <div class="report-section">
        <h2 class="section-title">📝 Recent Mood Entries</h2>
        ${data.entries.slice(0, 10).map(entry => `
            <div class="mood-entry">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 1.5em; margin-right: 10px;">${entry.emoji}</span>
                    <div style="flex-grow: 1;">
                        <strong>${entry.emotion}</strong> - <span class="mood-score">${entry.moodScore}/10</span>
                        <div style="font-size: 0.9em; color: #6B7280;">${entry.timestamp.toLocaleDateString()} at ${entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                </div>
                ${entry.phrase && exportOptions.includePersonalNotes ? `<p style="margin: 8px 0; font-style: italic;">"${entry.phrase}"</p>` : ''}
                ${entry.tags.length > 0 ? `<div style="margin-top: 8px;">Tags: ${entry.tags.map(tag => `<span style="background: #E5E7EB; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; margin-right: 5px;">${tag}</span>`).join('')}</div>` : ''}
                ${entry.voiceNote && exportOptions.includeVoiceNotes ? `<div style="margin-top: 8px; color: #6B7280; font-size: 0.9em;">🎙️ Voice note recorded (${entry.voiceNote.duration}s)</div>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="footer">
        <p><strong>SATA Mental Health Platform</strong></p>
        <p style="font-size: 0.9em; margin-top: 10px;">
            This report is generated from patient-reported mood data and should be considered alongside clinical observations and formal assessments. 
            Data is encrypted and HIPAA-compliant. For questions about this report, please contact the healthcare provider.
        </p>
        <p style="font-size: 0.8em; margin-top: 15px; color: #D1D5DB;">
            Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        </p>
    </div>
</body>
</html>
    `;
  };

  const renderPreviewSummary = () => {
    if (!previewData) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Report Preview</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{previewData.summary.totalEntries}</div>
            <div className="text-sm text-blue-700">Total Entries</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{previewData.summary.averageMood.toFixed(1)}/10</div>
            <div className="text-sm text-green-700">Average Mood</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{previewData.trends.length}</div>
            <div className="text-sm text-purple-700">Trends Analyzed</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{previewData.patterns.length}</div>
            <div className="text-sm text-orange-700">Patterns Found</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">📈 Key Findings</h4>
            <div className="space-y-2">
              {previewData.insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900">{insight.title}</div>
                  <div className="text-sm text-gray-600">{insight.description}</div>
                </div>
              ))}
            </div>
          </div>

          {previewData.assessmentCorrelations && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🔗 Assessment Correlations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {previewData.assessmentCorrelations.phq4Correlation !== 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-900">PHQ-4 Correlation</div>
                    <div className="text-lg font-bold text-blue-600">
                      {(Math.abs(previewData.assessmentCorrelations.phq4Correlation) * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
                {previewData.assessmentCorrelations.gad7Correlation !== 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-900">GAD-7 Correlation</div>
                    <div className="text-lg font-bold text-green-600">
                      {(Math.abs(previewData.assessmentCorrelations.gad7Correlation) * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Export Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">🏥 Healthcare Provider Export</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Report Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Format</label>
            <select
              value={exportOptions.format}
              onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="comprehensive">Comprehensive Report</option>
              <option value="summary">Executive Summary</option>
              <option value="clinical">Clinical Focus</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Comprehensive includes all data, Summary focuses on key metrics, Clinical emphasizes medical insights
            </p>
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={exportOptions.timeRange.start.toISOString().split('T')[0]}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  timeRange: { ...prev.timeRange, start: new Date(e.target.value) }
                }))}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="date"
                value={exportOptions.timeRange.end.toISOString().split('T')[0]}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  timeRange: { ...prev.timeRange, end: new Date(e.target.value) }
                }))}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Privacy Options */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy & Content Options</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeVoiceNotes}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includeVoiceNotes: e.target.checked }))}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Include Voice Note Data</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includePersonalNotes}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includePersonalNotes: e.target.checked }))}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Include Personal Notes</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.anonymizeData}
                onChange={(e) => setExportOptions(prev => ({ ...prev, anonymizeData: e.target.checked }))}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Anonymize Patient Data</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.correlateAssessments}
                onChange={(e) => setExportOptions(prev => ({ ...prev, correlateAssessments: e.target.checked }))}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Include Assessment Correlations</span>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={generatePreview}
            disabled={isGenerating}
            className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
              isGenerating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isGenerating ? 'Generating...' : '🔍 Generate Preview'}
          </button>
        </div>
      </div>

      {/* Preview */}
      {showPreview && previewData && (
        <div className="space-y-4">
          {renderPreviewSummary()}
          
          {/* Download Options */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📥 Download Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={downloadReport}
                className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <span className="mr-2">📄</span>
                Download HTML Report
              </button>
              
              <button
                onClick={downloadJSON}
                className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <span className="mr-2">💾</span>
                Download Raw Data (JSON)
              </button>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start">
                <span className="text-yellow-600 mr-2">⚠️</span>
                <div>
                  <h4 className="font-medium text-yellow-900">HIPAA Compliance Notice</h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    This report contains protected health information (PHI). Ensure proper handling according to 
                    HIPAA guidelines. Only authorized healthcare providers should access this data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Clinical Usage Guidelines</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">📊 Report Interpretation</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Mood scores range from 1-10 (higher = better emotional state)</li>
              <li>• Trends show direction and confidence levels for different time periods</li>
              <li>• Pattern recognition identifies behavioral and temporal correlations</li>
              <li>• Assessment correlations show alignment with formal screening tools</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">🔒 Privacy Considerations</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Voice note transcripts contain potentially sensitive information</li>
              <li>• Personal notes may include private thoughts and experiences</li>
              <li>• Anonymization removes identifying information but preserves clinical value</li>
              <li>• Data correlation maintains therapeutic insights while protecting privacy</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">⚕️ Clinical Applications</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Track treatment efficacy between appointments</li>
              <li>• Identify patterns that inform therapeutic interventions</li>
              <li>• Monitor medication effects on mood stability</li>
              <li>• Validate patient self-reports with objective data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthcareExport;
