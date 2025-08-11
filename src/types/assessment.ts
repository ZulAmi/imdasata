export interface PHQ4Response {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  totalScore: number;
  depressionScore: number;
  anxietyScore: number;
  severityLevel: string;
  riskLevel: 'minimal' | 'mild' | 'moderate' | 'severe';
  recommendations: string[];
  timestamp: string;
  anonymousId: string;
  language: string;
}

export interface AssessmentSubmission {
  anonymousId: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  language: string;
  countryOfOrigin?: string;
  ageGroup?: string;
  gender?: string;
  employmentSector?: string;
  completionTime?: number;
}
