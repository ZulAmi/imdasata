/**
 * QR Code Generation Service for SATA
 * Generate QR codes for mental health resources, appointments, and quick access
 */

import { EventEmitter } from 'events';

export interface QRCodeConfig {
  defaultSize: number;
  defaultErrorCorrection: 'L' | 'M' | 'Q' | 'H';
  defaultFormat: 'PNG' | 'SVG' | 'PDF';
  baseUrl: string;
  staticResourcePath: string;
}

export interface QRCodeOptions {
  size?: number;
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  format?: 'PNG' | 'SVG' | 'PDF';
  margin?: number;
  foregroundColor?: string;
  backgroundColor?: string;
  logo?: {
    url: string;
    size: number;
    margin: number;
  };
  border?: {
    width: number;
    color: string;
  };
  customization?: {
    cornerStyle: 'square' | 'rounded' | 'circle';
    dataPattern: 'square' | 'circle' | 'rounded';
    eyeStyle: 'square' | 'circle' | 'rounded';
  };
}

export interface QRCodeData {
  type: 'url' | 'text' | 'wifi' | 'contact' | 'sms' | 'email' | 'calendar' | 'location' | 'mental-health-resource';
  content: string | QRContentData;
  metadata?: {
    title?: string;
    description?: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    expiresAt?: Date;
    accessLevel?: 'public' | 'authenticated' | 'therapist-only';
  };
}

export interface QRContentData {
  // URL type
  url?: string;
  
  // Contact type
  contact?: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    organization?: string;
    title?: string;
    website?: string;
  };
  
  // WiFi type
  wifi?: {
    ssid: string;
    password?: string;
    security: 'WPA' | 'WEP' | 'none';
    hidden?: boolean;
  };
  
  // SMS type
  sms?: {
    phoneNumber: string;
    message?: string;
  };
  
  // Email type
  email?: {
    to: string;
    subject?: string;
    body?: string;
  };
  
  // Calendar type
  calendar?: {
    title: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    description?: string;
    allDay?: boolean;
  };
  
  // Location type
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  
  // Mental Health Resource type
  mentalHealthResource?: {
    resourceType: 'crisis-hotline' | 'therapy-session' | 'assessment' | 'medication-reminder' | 'mood-tracker' | 'emergency-contact';
    resourceId: string;
    title: string;
    description: string;
    actionUrl: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    requiresAuth?: boolean;
    validUntil?: Date;
  };
}

export interface QRCodeResult {
  id: string;
  data: QRCodeData;
  options: QRCodeOptions;
  qrCode: {
    base64: string;
    url: string;
    svg?: string;
    filePath: string;
  };
  analytics: {
    createdAt: Date;
    scanCount: number;
    lastScanned?: Date;
    scanLocations?: Array<{
      timestamp: Date;
      location?: string;
      userAgent?: string;
      ip?: string;
    }>;
  };
  metadata: {
    size: number;
    estimatedDataSize: number;
    errorCorrectionLevel: string;
    version: number;
  };
}

export interface QRBatch {
  id: string;
  title: string;
  description?: string;
  codes: QRCodeResult[];
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

class QRCodeService extends EventEmitter {
  private config: QRCodeConfig;
  private qrCodes: Map<string, QRCodeResult> = new Map();
  private batches: Map<string, QRBatch> = new Map();
  private analytics: Map<string, any> = new Map();

  constructor(config: Partial<QRCodeConfig> = {}) {
    super();
    this.config = {
      defaultSize: 256,
      defaultErrorCorrection: 'M',
      defaultFormat: 'PNG',
      baseUrl: 'https://sata-app.com',
      staticResourcePath: '/qr-codes',
      ...config
    };
  }

  /**
   * Generate QR code for mental health resources
   */
  async generateMentalHealthQR(
    resourceType: 'crisis-hotline' | 'therapy-session' | 'assessment' | 'medication-reminder' | 'mood-tracker' | 'emergency-contact',
    resourceData: {
      id: string;
      title: string;
      description: string;
      url: string;
      urgency?: 'low' | 'medium' | 'high' | 'critical';
      requiresAuth?: boolean;
      validUntil?: Date;
    },
    options?: QRCodeOptions
  ): Promise<QRCodeResult> {
    const qrData: QRCodeData = {
      type: 'mental-health-resource',
      content: {
        mentalHealthResource: {
          resourceType,
          resourceId: resourceData.id,
          title: resourceData.title,
          description: resourceData.description,
          actionUrl: resourceData.url,
          urgency: resourceData.urgency || 'medium',
          requiresAuth: resourceData.requiresAuth || false,
          validUntil: resourceData.validUntil
        }
      },
      metadata: {
        title: resourceData.title,
        description: resourceData.description,
        category: 'mental-health',
        priority: resourceData.urgency || 'medium',
        expiresAt: resourceData.validUntil,
        accessLevel: resourceData.requiresAuth ? 'authenticated' : 'public'
      }
    };

    return this.generateQRCode(qrData, this.getMentalHealthQROptions(resourceType, options));
  }

  /**
   * Generate crisis hotline QR code
   */
  async generateCrisisHotlineQR(
    phoneNumber: string,
    name: string,
    options?: QRCodeOptions
  ): Promise<QRCodeResult> {
    const qrData: QRCodeData = {
      type: 'sms',
      content: {
        sms: {
          phoneNumber,
          message: `Hello, I need mental health support. This message was sent via SATA crisis QR code.`
        }
      },
      metadata: {
        title: `Crisis Hotline: ${name}`,
        description: `Quick access to ${name} crisis support`,
        category: 'crisis-support',
        priority: 'critical',
        accessLevel: 'public'
      }
    };

    const crisisOptions = {
      foregroundColor: '#dc3545', // Red for urgency
      backgroundColor: '#ffffff',
      logo: {
        url: '/assets/crisis-icon.png',
        size: 32,
        margin: 4
      },
      border: {
        width: 4,
        color: '#dc3545'
      },
      ...options
    };

    return this.generateQRCode(qrData, crisisOptions);
  }

  /**
   * Generate therapy session QR code
   */
  async generateTherapySessionQR(
    sessionData: {
      sessionId: string;
      therapistName: string;
      sessionDate: Date;
      sessionUrl: string;
      patientId: string;
    },
    options?: QRCodeOptions
  ): Promise<QRCodeResult> {
    const sessionUrl = `${this.config.baseUrl}/therapy/join/${sessionData.sessionId}?patient=${sessionData.patientId}`;
    
    const qrData: QRCodeData = {
      type: 'url',
      content: sessionUrl,
      metadata: {
        title: `Therapy Session with ${sessionData.therapistName}`,
        description: `Session on ${sessionData.sessionDate.toLocaleDateString()}`,
        category: 'therapy',
        priority: 'high',
        expiresAt: new Date(sessionData.sessionDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours after session
        accessLevel: 'authenticated'
      }
    };

    const therapyOptions = {
      foregroundColor: '#28a745', // Green for therapy
      backgroundColor: '#f8f9fa',
      logo: {
        url: '/assets/therapy-icon.png',
        size: 28,
        margin: 6
      },
      ...options
    };

    return this.generateQRCode(qrData, therapyOptions);
  }

  /**
   * Generate mood tracker QR code
   */
  async generateMoodTrackerQR(
    userId: string,
    quickEntry = false,
    options?: QRCodeOptions
  ): Promise<QRCodeResult> {
    const trackerUrl = `${this.config.baseUrl}/mood-tracker${quickEntry ? '/quick' : ''}?user=${userId}`;
    
    const qrData: QRCodeData = {
      type: 'url',
      content: trackerUrl,
      metadata: {
        title: quickEntry ? 'Quick Mood Check' : 'Mood Tracker',
        description: 'Track your daily mood and emotions',
        category: 'mood-tracking',
        priority: 'medium',
        accessLevel: 'authenticated'
      }
    };

    const moodOptions = {
      foregroundColor: '#007bff', // Blue for mood tracking
      backgroundColor: '#ffffff',
      customization: {
        cornerStyle: 'rounded' as const,
        dataPattern: 'circle' as const,
        eyeStyle: 'rounded' as const
      },
      ...options
    };

    return this.generateQRCode(qrData, moodOptions);
  }

  /**
   * Generate medication reminder QR code
   */
  async generateMedicationReminderQR(
    medicationData: {
      medicationId: string;
      name: string;
      dosage: string;
      frequency: string;
      userId: string;
    },
    options?: QRCodeOptions
  ): Promise<QRCodeResult> {
    const reminderUrl = `${this.config.baseUrl}/medication/reminder/${medicationData.medicationId}?user=${medicationData.userId}`;
    
    const qrData: QRCodeData = {
      type: 'url',
      content: reminderUrl,
      metadata: {
        title: `${medicationData.name} Reminder`,
        description: `${medicationData.dosage} - ${medicationData.frequency}`,
        category: 'medication',
        priority: 'high',
        accessLevel: 'authenticated'
      }
    };

    const medicationOptions = {
      foregroundColor: '#6f42c1', // Purple for medication
      backgroundColor: '#ffffff',
      logo: {
        url: '/assets/medication-icon.png',
        size: 24,
        margin: 8
      },
      ...options
    };

    return this.generateQRCode(qrData, medicationOptions);
  }

  /**
   * Generate emergency contact QR code
   */
  async generateEmergencyContactQR(
    contactData: {
      name: string;
      relationship: string;
      phone: string;
      email?: string;
      address?: string;
    },
    options?: QRCodeOptions
  ): Promise<QRCodeResult> {
    const qrData: QRCodeData = {
      type: 'contact',
      content: {
        contact: {
          firstName: contactData.name.split(' ')[0],
          lastName: contactData.name.split(' ').slice(1).join(' '),
          phone: contactData.phone,
          email: contactData.email,
          organization: `Emergency Contact - ${contactData.relationship}`,
          title: contactData.relationship
        }
      },
      metadata: {
        title: `Emergency Contact: ${contactData.name}`,
        description: `${contactData.relationship} - ${contactData.phone}`,
        category: 'emergency-contact',
        priority: 'critical',
        accessLevel: 'public'
      }
    };

    const emergencyOptions = {
      foregroundColor: '#dc3545', // Red for emergency
      backgroundColor: '#fff3cd',
      border: {
        width: 3,
        color: '#dc3545'
      },
      ...options
    };

    return this.generateQRCode(qrData, emergencyOptions);
  }

  /**
   * Generate assessment QR code
   */
  async generateAssessmentQR(
    assessmentData: {
      assessmentId: string;
      title: string;
      type: 'PHQ-9' | 'GAD-7' | 'Beck-Depression' | 'PTSD-Checklist' | 'Custom';
      estimatedDuration: number;
      userId?: string;
    },
    options?: QRCodeOptions
  ): Promise<QRCodeResult> {
    const assessmentUrl = `${this.config.baseUrl}/assessment/${assessmentData.assessmentId}${assessmentData.userId ? `?user=${assessmentData.userId}` : ''}`;
    
    const qrData: QRCodeData = {
      type: 'url',
      content: assessmentUrl,
      metadata: {
        title: assessmentData.title,
        description: `${assessmentData.type} assessment (~${assessmentData.estimatedDuration} min)`,
        category: 'assessment',
        priority: 'medium',
        accessLevel: assessmentData.userId ? 'authenticated' : 'public'
      }
    };

    const assessmentOptions = {
      foregroundColor: '#17a2b8', // Teal for assessments
      backgroundColor: '#ffffff',
      logo: {
        url: '/assets/assessment-icon.png',
        size: 26,
        margin: 6
      },
      ...options
    };

    return this.generateQRCode(qrData, assessmentOptions);
  }

  /**
   * Generate batch of QR codes
   */
  async generateQRBatch(
    title: string,
    qrDataArray: Array<{ data: QRCodeData; options?: QRCodeOptions }>,
    description?: string
  ): Promise<QRBatch> {
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const batch: QRBatch = {
      id: batchId,
      title,
      description,
      codes: [],
      createdAt: new Date(),
      status: 'pending'
    };

    this.batches.set(batchId, batch);
    this.emit('batch:created', { batchId, title, count: qrDataArray.length });

    try {
      batch.status = 'processing';
      
      for (let i = 0; i < qrDataArray.length; i++) {
        const { data, options } = qrDataArray[i];
        const qrResult = await this.generateQRCode(data, options);
        batch.codes.push(qrResult);
        
        this.emit('batch:progress', {
          batchId,
          completed: i + 1,
          total: qrDataArray.length,
          progress: ((i + 1) / qrDataArray.length) * 100
        });
      }

      batch.status = 'completed';
      this.batches.set(batchId, batch);
      
      this.emit('batch:completed', { batchId, count: batch.codes.length });
      return batch;
    } catch (error) {
      batch.status = 'failed';
      this.batches.set(batchId, batch);
      this.emit('batch:failed', { batchId, error });
      throw error;
    }
  }

  /**
   * Core QR code generation method
   */
  private async generateQRCode(data: QRCodeData, options?: QRCodeOptions): Promise<QRCodeResult> {
    const qrId = `qr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const finalOptions = { ...this.getDefaultOptions(), ...options };
    
    try {
      // Convert data to QR code content string
      const qrContent = this.dataToQRString(data);
      
      // Generate QR code (using a hypothetical QR library)
      const qrCodeData = await this.generateQRCodeImage(qrContent, finalOptions);
      
      const result: QRCodeResult = {
        id: qrId,
        data,
        options: finalOptions,
        qrCode: {
          base64: qrCodeData.base64,
          url: `${this.config.baseUrl}${this.config.staticResourcePath}/${qrId}.png`,
          svg: qrCodeData.svg,
          filePath: `${this.config.staticResourcePath}/${qrId}.${finalOptions.format?.toLowerCase()}`
        },
        analytics: {
          createdAt: new Date(),
          scanCount: 0
        },
        metadata: {
          size: finalOptions.size || this.config.defaultSize,
          estimatedDataSize: qrContent.length,
          errorCorrectionLevel: finalOptions.errorCorrection || this.config.defaultErrorCorrection,
          version: this.calculateQRVersion(qrContent.length)
        }
      };

      this.qrCodes.set(qrId, result);
      this.emit('qr:generated', { id: qrId, type: data.type, category: data.metadata?.category });
      
      return result;
    } catch (error) {
      this.emit('qr:error', { id: qrId, error, data });
      throw error;
    }
  }

  /**
   * Track QR code scan
   */
  trackScan(qrId: string, scanData?: {
    location?: string;
    userAgent?: string;
    ip?: string;
  }): void {
    const qrCode = this.qrCodes.get(qrId);
    if (!qrCode) return;

    qrCode.analytics.scanCount++;
    qrCode.analytics.lastScanned = new Date();
    
    if (scanData) {
      if (!qrCode.analytics.scanLocations) {
        qrCode.analytics.scanLocations = [];
      }
      qrCode.analytics.scanLocations.push({
        timestamp: new Date(),
        ...scanData
      });
    }

    this.qrCodes.set(qrId, qrCode);
    this.emit('qr:scanned', { id: qrId, scanCount: qrCode.analytics.scanCount, scanData });
  }

  /**
   * Get QR code analytics
   */
  getAnalytics(qrId?: string): any {
    if (qrId) {
      const qrCode = this.qrCodes.get(qrId);
      return qrCode ? qrCode.analytics : null;
    }

    // Return aggregate analytics
    const totalCodes = this.qrCodes.size;
    const totalScans = Array.from(this.qrCodes.values())
      .reduce((sum, qr) => sum + qr.analytics.scanCount, 0);
    
    const categories = Array.from(this.qrCodes.values())
      .reduce((acc, qr) => {
        const category = qr.data.metadata?.category || 'other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

    return {
      totalCodes,
      totalScans,
      averageScansPerCode: totalCodes > 0 ? totalScans / totalCodes : 0,
      categories,
      mostScannedTypes: this.getMostScannedTypes()
    };
  }

  /**
   * Helper methods
   */
  private getDefaultOptions(): QRCodeOptions {
    return {
      size: this.config.defaultSize,
      errorCorrection: this.config.defaultErrorCorrection,
      format: this.config.defaultFormat,
      margin: 4,
      foregroundColor: '#000000',
      backgroundColor: '#ffffff'
    };
  }

  private getMentalHealthQROptions(resourceType: string, options?: QRCodeOptions): QRCodeOptions {
    const typeColors = {
      'crisis-hotline': '#dc3545',
      'therapy-session': '#28a745',
      'assessment': '#17a2b8',
      'medication-reminder': '#6f42c1',
      'mood-tracker': '#007bff',
      'emergency-contact': '#fd7e14'
    };

    return {
      ...this.getDefaultOptions(),
      foregroundColor: typeColors[resourceType as keyof typeof typeColors] || '#6c757d',
      customization: {
        cornerStyle: 'rounded',
        dataPattern: 'rounded',
        eyeStyle: 'rounded'
      },
      ...options
    };
  }

  private dataToQRString(data: QRCodeData): string {
    switch (data.type) {
      case 'url':
        return typeof data.content === 'string' ? data.content : '';
        
      case 'text':
        return typeof data.content === 'string' ? data.content : '';
        
      case 'contact':
        const contact = (data.content as QRContentData).contact!;
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.firstName} ${contact.lastName}\nTEL:${contact.phone}\nEMAIL:${contact.email}\nORG:${contact.organization}\nTITLE:${contact.title}\nEND:VCARD`;
        
      case 'wifi':
        const wifi = (data.content as QRContentData).wifi!;
        return `WIFI:T:${wifi.security};S:${wifi.ssid};P:${wifi.password};H:${wifi.hidden ? 'true' : 'false'};;`;
        
      case 'sms':
        const sms = (data.content as QRContentData).sms!;
        return `SMSTO:${sms.phoneNumber}:${sms.message || ''}`;
        
      case 'email':
        const email = (data.content as QRContentData).email!;
        return `mailto:${email.to}?subject=${encodeURIComponent(email.subject || '')}&body=${encodeURIComponent(email.body || '')}`;
        
      case 'location':
        const location = (data.content as QRContentData).location!;
        return `geo:${location.latitude},${location.longitude}`;
        
      case 'mental-health-resource':
        const resource = (data.content as QRContentData).mentalHealthResource!;
        return resource.actionUrl;
        
      default:
        return typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
    }
  }

  private async generateQRCodeImage(content: string, options: QRCodeOptions): Promise<{
    base64: string;
    svg?: string;
  }> {
    // This would integrate with a QR code library like 'qrcode' or 'node-qrcode'
    // For now, return mock data
    return {
      base64: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEA...mock-base64-data`,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${options.size}" height="${options.size}"><!-- QR Code SVG --></svg>`
    };
  }

  private calculateQRVersion(dataLength: number): number {
    // QR code version calculation based on data length
    if (dataLength <= 25) return 1;
    if (dataLength <= 47) return 2;
    if (dataLength <= 77) return 3;
    if (dataLength <= 114) return 4;
    // ... up to version 40
    return Math.min(40, Math.ceil(dataLength / 25));
  }

  private getMostScannedTypes(): Array<{ type: string; scans: number }> {
    const typeScans = Array.from(this.qrCodes.values())
      .reduce((acc, qr) => {
        const type = qr.data.type;
        acc[type] = (acc[type] || 0) + qr.analytics.scanCount;
        return acc;
      }, {} as { [key: string]: number });

    return Object.entries(typeScans)
      .map(([type, scans]) => ({ type, scans }))
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 10);
  }

  /**
   * Get QR code by ID
   */
  getQRCode(qrId: string): QRCodeResult | null {
    return this.qrCodes.get(qrId) || null;
  }

  /**
   * Get batch by ID
   */
  getBatch(batchId: string): QRBatch | null {
    return this.batches.get(batchId) || null;
  }

  /**
   * Delete QR code
   */
  deleteQRCode(qrId: string): boolean {
    return this.qrCodes.delete(qrId);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    stats: {
      totalCodes: number;
      totalBatches: number;
      totalScans: number;
    };
  }> {
    const totalScans = Array.from(this.qrCodes.values())
      .reduce((sum, qr) => sum + qr.analytics.scanCount, 0);

    return {
      isHealthy: true,
      stats: {
        totalCodes: this.qrCodes.size,
        totalBatches: this.batches.size,
        totalScans
      }
    };
  }
}

export default QRCodeService;
