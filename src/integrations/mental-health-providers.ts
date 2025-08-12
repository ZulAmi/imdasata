/**
 * Mental Health Service Provider APIs Integration for SATA
 * Connects with therapy platforms, EHR systems, and mental health databases
 */

import { EventEmitter } from 'events';

export interface ProviderConfig {
  name: string;
  type: 'therapy-platform' | 'ehr-system' | 'assessment-tool' | 'crisis-service' | 'medication-management';
  apiUrl: string;
  authentication: {
    type: 'api-key' | 'oauth' | 'basic' | 'bearer' | 'certificate';
    credentials: {
      apiKey?: string;
      clientId?: string;
      clientSecret?: string;
      username?: string;
      password?: string;
      accessToken?: string;
      refreshToken?: string;
      certificate?: string;
      privateKey?: string;
    };
  };
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  endpoints: {
    [key: string]: string;
  };
  features: string[];
}

export interface TherapistProfile {
  id: string;
  name: string;
  credentials: string[];
  specializations: string[];
  languages: string[];
  availability: {
    timezone: string;
    schedule: Array<{
      day: string;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>;
  };
  contactInfo: {
    email?: string;
    phone?: string;
    videoCallUrl?: string;
  };
  ratings: {
    average: number;
    totalReviews: number;
  };
  isAcceptingNewPatients: boolean;
  insuranceAccepted: string[];
  sessionTypes: ('in-person' | 'video' | 'phone' | 'text')[];
}

export interface PatientRecord {
  id: string;
  demographics: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    phoneNumber: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phoneNumber: string;
    };
  };
  mentalHealthHistory: {
    currentDiagnoses: Array<{
      code: string; // ICD-10 or DSM-5 code
      description: string;
      diagnosedDate: Date;
      severity: 'mild' | 'moderate' | 'severe';
    }>;
    previousTreatments: Array<{
      type: string;
      provider: string;
      startDate: Date;
      endDate?: Date;
      outcome: string;
    }>;
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      prescribedDate: Date;
      prescribedBy: string;
      isActive: boolean;
    }>;
    allergies: string[];
    familyHistory: string[];
  };
  currentTreatment: {
    therapistId?: string;
    treatmentPlan: string;
    goals: string[];
    lastSession?: Date;
    nextSession?: Date;
    sessionFrequency: string;
  };
  riskAssessment: {
    suicideRisk: 'low' | 'medium' | 'high' | 'imminent';
    selfHarmRisk: 'low' | 'medium' | 'high';
    lastAssessmentDate: Date;
    assessedBy: string;
    notes: string;
  };
}

export interface SessionNote {
  id: string;
  patientId: string;
  therapistId: string;
  sessionDate: Date;
  sessionType: 'initial' | 'individual' | 'group' | 'family' | 'crisis';
  duration: number; // minutes
  notes: {
    subjective: string; // Patient's reported experience
    objective: string; // Therapist's observations
    assessment: string; // Clinical assessment
    plan: string; // Treatment plan updates
  };
  mood: {
    scale: number; // 1-10
    description: string;
  };
  progress: {
    goalsAddressed: string[];
    progressMade: string;
    challengesIdentified: string[];
  };
  nextSteps: string[];
  riskAssessment?: {
    suicideRisk: string;
    interventionsUsed: string[];
  };
  isConfidential: boolean;
}

export interface AssessmentResult {
  id: string;
  patientId: string;
  assessmentType: 'PHQ-9' | 'GAD-7' | 'Beck-Depression' | 'PTSD-Checklist' | 'Custom';
  completedDate: Date;
  scores: {
    total: number;
    subscales?: { [key: string]: number };
  };
  interpretation: {
    severity: string;
    recommendations: string[];
    flaggedItems: string[];
  };
  administeredBy: string;
  validityChecks: {
    isValid: boolean;
    warnings: string[];
  };
}

export interface AppointmentSlot {
  id: string;
  therapistId: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  sessionType: 'video' | 'phone' | 'in-person';
  location?: string;
  cost: number;
  insuranceCovered: boolean;
}

export interface BookingRequest {
  patientId: string;
  therapistId: string;
  slotId: string;
  preferredSessionType: 'video' | 'phone' | 'in-person';
  notes?: string;
  isUrgent: boolean;
  insuranceInfo?: {
    provider: string;
    memberId: string;
    groupNumber: string;
  };
}

class MentalHealthProviderAPI extends EventEmitter {
  private providers: Map<string, ProviderConfig> = new Map();
  private authTokens: Map<string, { token: string; expiresAt: Date }> = new Map();
  private rateLimiters: Map<string, { requests: number; resetTime: Date }> = new Map();

  constructor() {
    super();
    this.initializeProviders();
  }

  /**
   * Register a new mental health service provider
   */
  registerProvider(config: ProviderConfig): void {
    this.providers.set(config.name, config);
    this.rateLimiters.set(config.name, {
      requests: 0,
      resetTime: new Date(Date.now() + 60000)
    });
    this.emit('provider:registered', { name: config.name, type: config.type });
  }

  /**
   * Find available therapists based on criteria
   */
  async findTherapists(criteria: {
    specializations?: string[];
    languages?: string[];
    availability?: {
      startDate: Date;
      endDate: Date;
      timeOfDay?: 'morning' | 'afternoon' | 'evening';
    };
    sessionType?: 'video' | 'phone' | 'in-person';
    location?: {
      zipCode?: string;
      radius?: number; // miles
    };
    insurance?: string;
    gender?: string;
    maxCost?: number;
  }): Promise<TherapistProfile[]> {
    const therapists: TherapistProfile[] = [];

    for (const [providerName, provider] of this.providers.entries()) {
      if (!provider.features.includes('therapist-directory')) continue;

      try {
        const providerTherapists = await this.searchTherapistsAtProvider(providerName, criteria);
        therapists.push(...providerTherapists);
      } catch (error) {
        this.emit('provider:search:error', { provider: providerName, error });
      }
    }

    return this.rankTherapists(therapists, criteria);
  }

  /**
   * Get available appointment slots
   */
  async getAvailableSlots(
    therapistId: string,
    startDate: Date,
    endDate: Date,
    sessionType?: 'video' | 'phone' | 'in-person'
  ): Promise<AppointmentSlot[]> {
    const therapist = await this.getTherapistDetails(therapistId);
    if (!therapist) {
      throw new Error('Therapist not found');
    }

    // Find which provider manages this therapist
    const providerName = await this.findProviderForTherapist(therapistId);
    if (!providerName) {
      throw new Error('Provider not found for therapist');
    }

    return this.getProviderAvailableSlots(providerName, therapistId, startDate, endDate, sessionType);
  }

  /**
   * Book an appointment
   */
  async bookAppointment(booking: BookingRequest): Promise<{
    confirmationId: string;
    appointmentDetails: AppointmentSlot;
    paymentRequired: boolean;
    paymentAmount?: number;
    cancellationPolicy: string;
  }> {
    const providerName = await this.findProviderForTherapist(booking.therapistId);
    if (!providerName) {
      throw new Error('Provider not found for therapist');
    }

    const provider = this.providers.get(providerName)!;
    
    try {
      const bookingEndpoint = provider.endpoints.bookAppointment;
      const response = await this.makeAuthenticatedRequest(
        providerName,
        'POST',
        bookingEndpoint,
        booking
      );

      const result = {
        confirmationId: response.confirmationId,
        appointmentDetails: response.appointment,
        paymentRequired: response.paymentRequired || false,
        paymentAmount: response.paymentAmount,
        cancellationPolicy: response.cancellationPolicy || 'Standard 24-hour cancellation policy'
      };

      this.emit('appointment:booked', { booking, result, provider: providerName });
      return result;
    } catch (error) {
      this.emit('appointment:booking:error', { booking, error, provider: providerName });
      throw error;
    }
  }

  /**
   * Submit patient assessment
   */
  async submitAssessment(
    patientId: string,
    assessmentType: string,
    responses: { [questionId: string]: any },
    providerName?: string
  ): Promise<AssessmentResult> {
    const targetProvider = providerName || this.findBestProviderForAssessment(assessmentType);
    if (!targetProvider) {
      throw new Error('No suitable provider found for assessment');
    }

    const provider = this.providers.get(targetProvider)!;
    
    try {
      const assessmentEndpoint = provider.endpoints.submitAssessment;
      const payload = {
        patientId,
        assessmentType,
        responses,
        submittedAt: new Date().toISOString()
      };

      const response = await this.makeAuthenticatedRequest(
        targetProvider,
        'POST',
        assessmentEndpoint,
        payload
      );

      const result: AssessmentResult = {
        id: response.assessmentId,
        patientId,
        assessmentType: assessmentType as any,
        completedDate: new Date(),
        scores: response.scores,
        interpretation: response.interpretation,
        administeredBy: 'SATA Platform',
        validityChecks: response.validityChecks || { isValid: true, warnings: [] }
      };

      this.emit('assessment:submitted', { patientId, result, provider: targetProvider });
      return result;
    } catch (error) {
      this.emit('assessment:error', { patientId, assessmentType, error, provider: targetProvider });
      throw error;
    }
  }

  /**
   * Create or update patient record
   */
  async updatePatientRecord(
    record: Partial<PatientRecord>,
    providerName?: string
  ): Promise<PatientRecord> {
    const targetProvider = providerName || this.findBestProviderForEHR();
    if (!targetProvider) {
      throw new Error('No EHR provider configured');
    }

    const provider = this.providers.get(targetProvider)!;
    
    try {
      const ehrEndpoint = provider.endpoints.updatePatient;
      const response = await this.makeAuthenticatedRequest(
        targetProvider,
        record.id ? 'PUT' : 'POST',
        ehrEndpoint,
        record
      );

      const updatedRecord: PatientRecord = response.patient;
      
      this.emit('patient:updated', { patientId: updatedRecord.id, provider: targetProvider });
      return updatedRecord;
    } catch (error) {
      this.emit('patient:update:error', { record, error, provider: targetProvider });
      throw error;
    }
  }

  /**
   * Submit session notes
   */
  async submitSessionNotes(
    notes: Omit<SessionNote, 'id'>,
    providerName?: string
  ): Promise<SessionNote> {
    const targetProvider = providerName || this.findBestProviderForEHR();
    if (!targetProvider) {
      throw new Error('No EHR provider configured');
    }

    const provider = this.providers.get(targetProvider)!;
    
    try {
      const notesEndpoint = provider.endpoints.sessionNotes;
      const response = await this.makeAuthenticatedRequest(
        targetProvider,
        'POST',
        notesEndpoint,
        notes
      );

      const sessionNotes: SessionNote = {
        id: response.noteId,
        ...notes
      };

      this.emit('session:notes:submitted', { notes: sessionNotes, provider: targetProvider });
      return sessionNotes;
    } catch (error) {
      this.emit('session:notes:error', { notes, error, provider: targetProvider });
      throw error;
    }
  }

  /**
   * Get crisis intervention resources
   */
  async getCrisisResources(
    location: { zipCode: string; state: string },
    urgencyLevel: 'low' | 'medium' | 'high' | 'imminent'
  ): Promise<Array<{
    name: string;
    type: 'hotline' | 'mobile-crisis' | 'emergency-room' | 'crisis-center';
    contact: {
      phone: string;
      address?: string;
      website?: string;
    };
    availability: string;
    services: string[];
    distance?: number;
    acceptsInsurance: boolean;
  }>> {
    const crisisProviders = Array.from(this.providers.values())
      .filter(p => p.features.includes('crisis-services'));

    const resources: any[] = [];

    for (const provider of crisisProviders) {
      try {
        const providerResources = await this.getCrisisResourcesFromProvider(
          provider.name,
          location,
          urgencyLevel
        );
        resources.push(...providerResources);
      } catch (error) {
        this.emit('crisis:resources:error', { provider: provider.name, error });
      }
    }

    return this.sortCrisisResourcesByUrgency(resources, urgencyLevel);
  }

  /**
   * Check medication interactions
   */
  async checkMedicationInteractions(
    medications: Array<{ name: string; dosage: string }>,
    newMedication: { name: string; dosage: string }
  ): Promise<{
    hasInteractions: boolean;
    interactions: Array<{
      severity: 'minor' | 'moderate' | 'major';
      description: string;
      recommendations: string[];
    }>;
    contraindications: string[];
    warnings: string[];
  }> {
    const medicationProvider = Array.from(this.providers.values())
      .find(p => p.features.includes('medication-management'));

    if (!medicationProvider) {
      throw new Error('No medication management provider configured');
    }

    try {
      const interactionEndpoint = medicationProvider.endpoints.checkInteractions;
      const response = await this.makeAuthenticatedRequest(
        medicationProvider.name,
        'POST',
        interactionEndpoint,
        { currentMedications: medications, newMedication }
      );

      this.emit('medication:interactions:checked', {
        medications,
        newMedication,
        result: response
      });

      return response;
    } catch (error) {
      this.emit('medication:interactions:error', { medications, newMedication, error });
      throw error;
    }
  }

  /**
   * Sync patient data across providers
   */
  async syncPatientData(
    patientId: string,
    sourceProvider: string,
    targetProviders: string[]
  ): Promise<{
    successful: string[];
    failed: Array<{ provider: string; error: string }>;
  }> {
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ provider: string; error: string }>
    };

    // Get patient data from source provider
    let patientData: PatientRecord;
    try {
      patientData = await this.getPatientRecord(patientId, sourceProvider);
    } catch (error) {
      throw new Error(`Failed to retrieve patient data from ${sourceProvider}: ${error}`);
    }

    // Sync to target providers
    for (const targetProvider of targetProviders) {
      try {
        await this.updatePatientRecord(patientData, targetProvider);
        results.successful.push(targetProvider);
      } catch (error) {
        results.failed.push({
          provider: targetProvider,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    this.emit('patient:sync:completed', {
      patientId,
      sourceProvider,
      results
    });

    return results;
  }

  /**
   * Get patient record from specific provider
   */
  private async getPatientRecord(patientId: string, providerName: string): Promise<PatientRecord> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const patientEndpoint = provider.endpoints.getPatient.replace('{id}', patientId);
    const response = await this.makeAuthenticatedRequest(
      providerName,
      'GET',
      patientEndpoint
    );

    return response.patient;
  }

  /**
   * Make authenticated request to provider API
   */
  private async makeAuthenticatedRequest(
    providerName: string,
    method: string,
    endpoint: string,
    data?: any
  ): Promise<any> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    // Check rate limits
    await this.checkRateLimit(providerName);

    // Get or refresh authentication token
    const authToken = await this.getAuthToken(providerName);

    const url = `${provider.apiUrl}${endpoint}`;
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    // Add authentication header
    switch (provider.authentication.type) {
      case 'api-key':
        headers['X-API-Key'] = authToken;
        break;
      case 'bearer':
        headers['Authorization'] = `Bearer ${authToken}`;
        break;
      case 'basic':
        headers['Authorization'] = `Basic ${authToken}`;
        break;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Get or refresh authentication token
   */
  private async getAuthToken(providerName: string): Promise<string> {
    const provider = this.providers.get(providerName)!;
    const existingToken = this.authTokens.get(providerName);

    // Return existing token if still valid
    if (existingToken && existingToken.expiresAt > new Date()) {
      return existingToken.token;
    }

    // Generate new token based on auth type
    let token: string;
    let expiresAt: Date;

    switch (provider.authentication.type) {
      case 'api-key':
        token = provider.authentication.credentials.apiKey!;
        expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
        break;
      case 'oauth':
        const oauthResult = await this.performOAuthFlow(provider);
        token = oauthResult.accessToken;
        expiresAt = oauthResult.expiresAt;
        break;
      case 'basic':
        const basic = Buffer.from(
          `${provider.authentication.credentials.username}:${provider.authentication.credentials.password}`
        ).toString('base64');
        token = basic;
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        break;
      default:
        throw new Error(`Unsupported authentication type: ${provider.authentication.type}`);
    }

    this.authTokens.set(providerName, { token, expiresAt });
    return token;
  }

  /**
   * Perform OAuth flow for provider
   */
  private async performOAuthFlow(provider: ProviderConfig): Promise<{
    accessToken: string;
    expiresAt: Date;
  }> {
    const { clientId, clientSecret } = provider.authentication.credentials;
    
    const tokenUrl = `${provider.apiUrl}/oauth/token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId!,
        client_secret: clientSecret!
      })
    });

    if (!response.ok) {
      throw new Error(`OAuth failed: ${response.status}`);
    }

    const result = await response.json();
    return {
      accessToken: result.access_token,
      expiresAt: new Date(Date.now() + (result.expires_in * 1000))
    };
  }

  /**
   * Check and enforce rate limits
   */
  private async checkRateLimit(providerName: string): Promise<void> {
    const provider = this.providers.get(providerName)!;
    const rateLimiter = this.rateLimiters.get(providerName)!;

    if (Date.now() > rateLimiter.resetTime.getTime()) {
      rateLimiter.requests = 0;
      rateLimiter.resetTime = new Date(Date.now() + 60000);
    }

    if (rateLimiter.requests >= provider.rateLimits.requestsPerMinute) {
      const waitTime = rateLimiter.resetTime.getTime() - Date.now();
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    rateLimiter.requests++;
  }

  /**
   * Initialize default mental health service providers
   */
  private initializeProviders(): void {
    // BetterHelp API Configuration
    this.registerProvider({
      name: 'betterhelp',
      type: 'therapy-platform',
      apiUrl: 'https://api.betterhelp.com/v1',
      authentication: {
        type: 'api-key',
        credentials: {
          apiKey: process.env.BETTERHELP_API_KEY || ''
        }
      },
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000
      },
      endpoints: {
        searchTherapists: '/therapists/search',
        getAvailability: '/therapists/{id}/availability',
        bookAppointment: '/appointments',
        getTherapist: '/therapists/{id}'
      },
      features: ['therapist-directory', 'appointment-booking', 'video-sessions']
    });

    // Talkspace API Configuration
    this.registerProvider({
      name: 'talkspace',
      type: 'therapy-platform',
      apiUrl: 'https://api.talkspace.com/v2',
      authentication: {
        type: 'oauth',
        credentials: {
          clientId: process.env.TALKSPACE_CLIENT_ID || '',
          clientSecret: process.env.TALKSPACE_CLIENT_SECRET || ''
        }
      },
      rateLimits: {
        requestsPerMinute: 30,
        requestsPerHour: 500,
        requestsPerDay: 5000
      },
      endpoints: {
        searchTherapists: '/providers/search',
        bookAppointment: '/sessions/book',
        submitAssessment: '/assessments'
      },
      features: ['therapist-directory', 'text-therapy', 'assessments']
    });

    // Epic EHR Integration
    this.registerProvider({
      name: 'epic',
      type: 'ehr-system',
      apiUrl: 'https://fhir.epic.com/interconnect-fhir-oauth',
      authentication: {
        type: 'oauth',
        credentials: {
          clientId: process.env.EPIC_CLIENT_ID || '',
          clientSecret: process.env.EPIC_CLIENT_SECRET || ''
        }
      },
      rateLimits: {
        requestsPerMinute: 120,
        requestsPerHour: 2000,
        requestsPerDay: 20000
      },
      endpoints: {
        getPatient: '/Patient/{id}',
        updatePatient: '/Patient',
        sessionNotes: '/DocumentReference',
        getAppointments: '/Appointment'
      },
      features: ['patient-records', 'session-notes', 'appointment-management']
    });

    // Crisis Text Line Integration
    this.registerProvider({
      name: 'crisis-text-line',
      type: 'crisis-service',
      apiUrl: 'https://api.crisistextline.org/v1',
      authentication: {
        type: 'api-key',
        credentials: {
          apiKey: process.env.CRISIS_TEXT_LINE_API_KEY || ''
        }
      },
      rateLimits: {
        requestsPerMinute: 10,
        requestsPerHour: 100,
        requestsPerDay: 1000
      },
      endpoints: {
        getCrisisResources: '/resources',
        submitCrisisReport: '/reports'
      },
      features: ['crisis-services', 'resource-directory']
    });
  }

  /**
   * Helper methods for provider operations
   */
  private async searchTherapistsAtProvider(providerName: string, criteria: any): Promise<TherapistProfile[]> {
    // Implementation would vary by provider
    return [];
  }

  private async getTherapistDetails(therapistId: string): Promise<TherapistProfile | null> {
    // Implementation to find therapist across providers
    return null;
  }

  private async findProviderForTherapist(therapistId: string): Promise<string | null> {
    // Implementation to identify which provider manages a therapist
    return null;
  }

  private async getProviderAvailableSlots(
    providerName: string,
    therapistId: string,
    startDate: Date,
    endDate: Date,
    sessionType?: string
  ): Promise<AppointmentSlot[]> {
    // Implementation to get slots from specific provider
    return [];
  }

  private findBestProviderForAssessment(assessmentType: string): string | null {
    // Logic to select best provider for specific assessment
    return Array.from(this.providers.keys())[0] || null;
  }

  private findBestProviderForEHR(): string | null {
    // Logic to select EHR provider
    const ehrProvider = Array.from(this.providers.values())
      .find(p => p.type === 'ehr-system');
    return ehrProvider?.name || null;
  }

  private async getCrisisResourcesFromProvider(
    providerName: string,
    location: any,
    urgencyLevel: string
  ): Promise<any[]> {
    // Implementation to get crisis resources from provider
    return [];
  }

  private rankTherapists(therapists: TherapistProfile[], criteria: any): TherapistProfile[] {
    // Implementation to rank therapists based on criteria
    return therapists.sort((a, b) => b.ratings.average - a.ratings.average);
  }

  private sortCrisisResourcesByUrgency(resources: any[], urgencyLevel: string): any[] {
    // Implementation to sort crisis resources by urgency and proximity
    return resources;
  }
}

export default MentalHealthProviderAPI;
