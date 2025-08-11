/**
 * Dynamic Mental Health Resources Directory System
 * Supports categorization, multi-language, scheduling, and admin management
 */

export type ResourceCategory = 'dormitory-based' | 'helplines' | 'clinics' | 'online-services' | 'peer-support' | 'government-services' | 'ngo-services' | 'emergency-services';

export type ContactMethod = 'phone' | 'whatsapp' | 'email' | 'website' | 'walk-in' | 'appointment' | 'online-chat' | 'video-call';

export type AvailabilityDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface DaySchedule {
  day: AvailabilityDay;
  isOpen: boolean;
  timeSlots: TimeSlot[];
  notes?: string; // e.g., "Emergency only", "By appointment"
}

export interface ContactInfo {
  method: ContactMethod;
  value: string;
  isPrimary: boolean;
  description?: string;
  languages?: string[];
}

export interface MultiLanguageText {
  en: string;
  zh?: string;
  bn?: string;
  ta?: string;
  my?: string;
  idn?: string;
}

export interface ResourceLocation {
  address: MultiLanguageText;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  nearbyLandmarks?: MultiLanguageText;
  transportationInfo?: MultiLanguageText;
  accessibilityInfo?: MultiLanguageText;
}

export interface ResourceFeedback {
  id: string;
  userId: string;
  resourceId: string;
  rating: number; // 1-5
  feedback: string;
  categories: {
    accessibility: number;
    effectiveness: number;
    staff_friendliness: number;
    language_support: number;
    wait_time: number;
  };
  wouldRecommend: boolean;
  visitDate: string;
  submittedAt: string;
  isVerified: boolean;
}

export interface ResourceUtilization {
  resourceId: string;
  date: string;
  metrics: {
    views: number;
    contacts: number;
    qr_scans: number;
    referrals: number;
    feedback_count: number;
    avg_rating: number;
  };
  demographicBreakdown: {
    by_country: Record<string, number>;
    by_age_group: Record<string, number>;
    by_employment: Record<string, number>;
    by_language: Record<string, number>;
  };
}

export interface MentalHealthResource {
  id: string;
  name: MultiLanguageText;
  description: MultiLanguageText;
  category: ResourceCategory;
  subcategory?: string;
  
  // Contact and Location
  contactInfo: ContactInfo[];
  location?: ResourceLocation;
  
  // Availability
  schedule: DaySchedule[];
  specialHours?: {
    date: string;
    schedule: DaySchedule[];
    reason: MultiLanguageText;
  }[];
  timezone: string;
  
  // Service Details
  servicesOffered: {
    service: MultiLanguageText;
    description: MultiLanguageText;
    languages: string[];
    cost: string; // "free", "paid", "sliding-scale", etc.
    requiresAppointment: boolean;
    duration?: string; // "30 minutes", "1 hour", etc.
  }[];
  
  // Target Demographics
  targetGroups: {
    countries?: string[];
    ageGroups?: string[];
    genders?: string[];
    employmentSectors?: string[];
    languages: string[];
    riskLevels?: string[];
    specificNeeds?: string[]; // "family issues", "work stress", etc.
  };
  
  // Provider Information
  provider: {
    name: MultiLanguageText;
    type: 'government' | 'ngo' | 'private' | 'community' | 'religious' | 'employer';
    credentials: string[];
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      linkedin?: string;
    };
  };
  
  // Quality and Effectiveness
  qualityMetrics: {
    averageRating: number;
    totalReviews: number;
    responseTime: string; // "immediate", "within 24 hours", etc.
    successRate?: number;
    waitTime: string; // "no wait", "1-3 days", etc.
  };
  
  // Administrative
  status: 'active' | 'inactive' | 'temporarily-closed' | 'full-capacity';
  verificationStatus: 'verified' | 'pending' | 'unverified';
  lastUpdated: string;
  addedBy: string; // admin user ID
  updatedBy?: string;
  
  // Accessibility
  accessibility: {
    wheelchairAccessible: boolean;
    hasTranslationServices: boolean;
    acceptsWalkIns: boolean;
    requiresReferral: boolean;
    ageRestrictions?: string;
    genderRestrictions?: string;
    costInfo: MultiLanguageText;
  };
  
  // Additional Features
  features: {
    hasChildcare: boolean;
    providesTransportation: boolean;
    hasOnlineOption: boolean;
    has24HourSupport: boolean;
    providesFollowUp: boolean;
    hasGroupSessions: boolean;
    hasIndividualSessions: boolean;
    providesCrisisIntervention: boolean;
  };
  
  // QR Code and Sharing
  qrCode?: {
    url: string;
    imageUrl: string;
    generatedAt: string;
  };
  
  // SEO and Searchability
  searchKeywords: {
    en: string[];
    zh?: string[];
    bn?: string[];
    ta?: string[];
    my?: string[];
    idn?: string[];
  };
  
  tags: string[];
}

export interface ResourceFilter {
  categories?: ResourceCategory[];
  languages?: string[];
  location?: {
    maxDistance?: number; // in km
    coordinates?: { lat: number; lng: number };
  };
  availability?: {
    day?: AvailabilityDay;
    time?: string; // HH:MM
    requiresImmediate?: boolean;
  };
  cost?: ('free' | 'paid' | 'sliding-scale')[];
  targetGroups?: {
    countries?: string[];
    ageGroups?: string[];
    employmentSectors?: string[];
  };
  features?: {
    wheelchairAccessible?: boolean;
    acceptsWalkIns?: boolean;
    hasOnlineOption?: boolean;
    has24HourSupport?: boolean;
    providesCrisisIntervention?: boolean;
  };
  rating?: {
    minRating?: number;
    minReviews?: number;
  };
  searchQuery?: string;
  sortBy?: 'rating' | 'distance' | 'name' | 'recently_added' | 'availability';
  sortOrder?: 'asc' | 'desc';
}

export interface ResourceSearchResult {
  resource: MentalHealthResource;
  relevanceScore: number;
  distance?: number; // in km if location-based search
  matchedFields: string[];
  isCurrentlyOpen: boolean;
  nextAvailableTime?: string;
}

export class ResourcesDirectoryManager {
  private resources: Map<string, MentalHealthResource> = new Map();
  private feedback: Map<string, ResourceFeedback[]> = new Map();
  private utilization: Map<string, ResourceUtilization[]> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeSampleResources();
    this.buildSearchIndex();
  }

  /**
   * Add a new resource to the directory
   */
  addResource(resource: MentalHealthResource): void {
    // Generate ID if not provided
    if (!resource.id) {
      resource.id = `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Set timestamps
    resource.lastUpdated = new Date().toISOString();
    
    // Generate QR code
    resource.qrCode = this.generateQRCode(resource);
    
    // Add to collection
    this.resources.set(resource.id, resource);
    
    // Update search index
    this.updateSearchIndex(resource);
    
    // Initialize feedback and utilization tracking
    this.feedback.set(resource.id, []);
    this.initializeUtilizationTracking(resource.id);
  }

  /**
   * Update an existing resource
   */
  updateResource(resourceId: string, updates: Partial<MentalHealthResource>): boolean {
    const resource = this.resources.get(resourceId);
    if (!resource) return false;

    // Merge updates
    const updatedResource = { ...resource, ...updates };
    updatedResource.lastUpdated = new Date().toISOString();
    
    // Regenerate QR code if contact info changed
    if (updates.contactInfo || updates.name) {
      updatedResource.qrCode = this.generateQRCode(updatedResource);
    }

    this.resources.set(resourceId, updatedResource);
    this.updateSearchIndex(updatedResource);
    
    return true;
  }

  /**
   * Search resources with advanced filtering
   */
  searchResources(filter: ResourceFilter, userLocation?: { lat: number; lng: number }): ResourceSearchResult[] {
    let results: ResourceSearchResult[] = [];

    for (const resource of this.resources.values()) {
      if (resource.status !== 'active') continue;

      const matchResult = this.matchResourceToFilter(resource, filter, userLocation);
      if (matchResult.matches) {
        results.push({
          resource,
          relevanceScore: matchResult.score,
          distance: matchResult.distance,
          matchedFields: matchResult.matchedFields,
          isCurrentlyOpen: this.isResourceCurrentlyOpen(resource),
          nextAvailableTime: this.getNextAvailableTime(resource)
        });
      }
    }

    // Sort results
    results = this.sortSearchResults(results, filter.sortBy || 'rating', filter.sortOrder || 'desc');

    return results;
  }

  /**
   * Get resource by ID
   */
  getResource(id: string): MentalHealthResource | null {
    return this.resources.get(id) || null;
  }

  /**
   * Get all resources in a category
   */
  getResourcesByCategory(category: ResourceCategory): MentalHealthResource[] {
    return Array.from(this.resources.values()).filter(r => r.category === category && r.status === 'active');
  }

  /**
   * Add feedback for a resource
   */
  addFeedback(feedback: Omit<ResourceFeedback, 'id' | 'submittedAt'>): string {
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const completeFeedback: ResourceFeedback = {
      ...feedback,
      id: feedbackId,
      submittedAt: new Date().toISOString(),
      isVerified: false
    };

    const resourceFeedback = this.feedback.get(feedback.resourceId) || [];
    resourceFeedback.push(completeFeedback);
    this.feedback.set(feedback.resourceId, resourceFeedback);

    // Update resource quality metrics
    this.updateResourceQualityMetrics(feedback.resourceId);

    return feedbackId;
  }

  /**
   * Track resource utilization
   */
  trackUtilization(resourceId: string, interactionType: 'view' | 'contact' | 'qr_scan' | 'referral', userDemographics?: any): void {
    const today = new Date().toISOString().split('T')[0];
    const utilizations = this.utilization.get(resourceId) || [];
    
    let todayUtil = utilizations.find(u => u.date === today);
    if (!todayUtil) {
      todayUtil = {
        resourceId,
        date: today,
        metrics: {
          views: 0,
          contacts: 0,
          qr_scans: 0,
          referrals: 0,
          feedback_count: 0,
          avg_rating: 0
        },
        demographicBreakdown: {
          by_country: {},
          by_age_group: {},
          by_employment: {},
          by_language: {}
        }
      };
      utilizations.push(todayUtil);
    }

    // Update metrics
    switch (interactionType) {
      case 'view':
        todayUtil.metrics.views++;
        break;
      case 'contact':
        todayUtil.metrics.contacts++;
        break;
      case 'qr_scan':
        todayUtil.metrics.qr_scans++;
        break;
      case 'referral':
        todayUtil.metrics.referrals++;
        break;
    }

    // Update demographic breakdown if provided
    if (userDemographics) {
      if (userDemographics.country) {
        todayUtil.demographicBreakdown.by_country[userDemographics.country] = 
          (todayUtil.demographicBreakdown.by_country[userDemographics.country] || 0) + 1;
      }
      if (userDemographics.ageGroup) {
        todayUtil.demographicBreakdown.by_age_group[userDemographics.ageGroup] = 
          (todayUtil.demographicBreakdown.by_age_group[userDemographics.ageGroup] || 0) + 1;
      }
      if (userDemographics.employment) {
        todayUtil.demographicBreakdown.by_employment[userDemographics.employment] = 
          (todayUtil.demographicBreakdown.by_employment[userDemographics.employment] || 0) + 1;
      }
      if (userDemographics.language) {
        todayUtil.demographicBreakdown.by_language[userDemographics.language] = 
          (todayUtil.demographicBreakdown.by_language[userDemographics.language] || 0) + 1;
      }
    }

    this.utilization.set(resourceId, utilizations);
  }

  /**
   * Get utilization analytics for a resource
   */
  getResourceAnalytics(resourceId: string, dateRange?: { start: string; end: string }): any {
    const utilizations = this.utilization.get(resourceId) || [];
    const feedbacks = this.feedback.get(resourceId) || [];

    let filteredUtil = utilizations;
    if (dateRange) {
      filteredUtil = utilizations.filter(u => 
        u.date >= dateRange.start && u.date <= dateRange.end
      );
    }

    const totalMetrics = filteredUtil.reduce((acc, util) => {
      acc.views += util.metrics.views;
      acc.contacts += util.metrics.contacts;
      acc.qr_scans += util.metrics.qr_scans;
      acc.referrals += util.metrics.referrals;
      return acc;
    }, { views: 0, contacts: 0, qr_scans: 0, referrals: 0 });

    const avgRating = feedbacks.length > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length 
      : 0;

    return {
      resourceId,
      period: dateRange || 'all_time',
      totalMetrics,
      averageRating: avgRating,
      totalFeedback: feedbacks.length,
      dailyBreakdown: filteredUtil,
      topDemographics: this.calculateTopDemographics(filteredUtil),
      conversionRate: totalMetrics.views > 0 ? totalMetrics.contacts / totalMetrics.views : 0,
      trendAnalysis: this.calculateTrends(filteredUtil)
    };
  }

  /**
   * Generate QR code for resource
   */
  private generateQRCode(resource: MentalHealthResource): { url: string; imageUrl: string; generatedAt: string } {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resourceUrl = `${baseUrl}/resources/${resource.id}`;
    
    // In production, you would use a QR code generation service
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(resourceUrl)}`;
    
    return {
      url: resourceUrl,
      imageUrl: qrImageUrl,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Check if resource is currently open
   */
  private isResourceCurrentlyOpen(resource: MentalHealthResource): boolean {
    const now = new Date();
    const dayNames: AvailabilityDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    const todaySchedule = resource.schedule.find(s => s.day === currentDay);
    if (!todaySchedule || !todaySchedule.isOpen) return false;

    return todaySchedule.timeSlots.some(slot => 
      currentTime >= slot.start && currentTime <= slot.end
    );
  }

  /**
   * Get next available time for a resource
   */
  private getNextAvailableTime(resource: MentalHealthResource): string | undefined {
    const now = new Date();
    const daysOfWeek: AvailabilityDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Check today first
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + i);
      
      const dayName = daysOfWeek[checkDate.getDay()];
      const daySchedule = resource.schedule.find(s => s.day === dayName);
      
      if (daySchedule?.isOpen && daySchedule.timeSlots.length > 0) {
        const firstSlot = daySchedule.timeSlots[0];
        if (i === 0) {
          // Today - check if there's a future slot
          const currentTime = now.toTimeString().slice(0, 5);
          const availableSlot = daySchedule.timeSlots.find(slot => slot.start > currentTime);
          if (availableSlot) {
            return `Today at ${availableSlot.start}`;
          }
        } else {
          // Future day
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return `${dayNames[checkDate.getDay()]} at ${firstSlot.start}`;
        }
      }
    }

    return undefined;
  }

  /**
   * Match resource to filter criteria
   */
  private matchResourceToFilter(
    resource: MentalHealthResource, 
    filter: ResourceFilter, 
    userLocation?: { lat: number; lng: number }
  ): { matches: boolean; score: number; distance?: number; matchedFields: string[] } {
    let score = 0;
    const matchedFields: string[] = [];
    let distance: number | undefined;

    // Category filter
    if (filter.categories && !filter.categories.includes(resource.category)) {
      return { matches: false, score: 0, matchedFields: [] };
    }
    if (filter.categories?.includes(resource.category)) {
      score += 20;
      matchedFields.push('category');
    }

    // Language filter
    if (filter.languages) {
      const hasLanguageMatch = filter.languages.some(lang => 
        resource.targetGroups.languages.includes(lang)
      );
      if (!hasLanguageMatch) {
        return { matches: false, score: 0, matchedFields: [] };
      }
      score += 15;
      matchedFields.push('language');
    }

    // Location and distance
    if (filter.location && userLocation && resource.location?.coordinates) {
      distance = this.calculateDistance(
        userLocation.lat, 
        userLocation.lng,
        resource.location.coordinates.latitude,
        resource.location.coordinates.longitude
      );
      
      if (filter.location.maxDistance && distance > filter.location.maxDistance) {
        return { matches: false, score: 0, matchedFields: [] };
      }
      
      // Closer resources get higher scores
      const distanceScore = Math.max(0, 20 - (distance / 5)); // Reduce score by 1 for every 5km
      score += distanceScore;
      matchedFields.push('location');
    }

    // Cost filter
    if (filter.cost) {
      const hasCostMatch = resource.servicesOffered.some(service => 
        filter.cost!.includes(service.cost as any)
      );
      if (!hasCostMatch) {
        return { matches: false, score: 0, matchedFields: [] };
      }
      score += 10;
      matchedFields.push('cost');
    }

    // Features filter
    if (filter.features) {
      let featureMatches = 0;
      let totalFeatureChecks = 0;

      Object.entries(filter.features).forEach(([feature, required]) => {
        if (required) {
          totalFeatureChecks++;
          if (feature === 'wheelchairAccessible' && resource.accessibility.wheelchairAccessible) featureMatches++;
          if (feature === 'acceptsWalkIns' && resource.accessibility.acceptsWalkIns) featureMatches++;
          if (feature === 'hasOnlineOption' && resource.features.hasOnlineOption) featureMatches++;
          if (feature === 'has24HourSupport' && resource.features.has24HourSupport) featureMatches++;
          if (feature === 'providesCrisisIntervention' && resource.features.providesCrisisIntervention) featureMatches++;
        }
      });

      if (totalFeatureChecks > 0 && featureMatches === 0) {
        return { matches: false, score: 0, matchedFields: [] };
      }
      
      if (featureMatches > 0) {
        score += (featureMatches / totalFeatureChecks) * 15;
        matchedFields.push('features');
      }
    }

    // Rating filter
    if (filter.rating) {
      if (filter.rating.minRating && resource.qualityMetrics.averageRating < filter.rating.minRating) {
        return { matches: false, score: 0, matchedFields: [] };
      }
      if (filter.rating.minReviews && resource.qualityMetrics.totalReviews < filter.rating.minReviews) {
        return { matches: false, score: 0, matchedFields: [] };
      }
      score += resource.qualityMetrics.averageRating * 2;
      matchedFields.push('rating');
    }

    // Search query
    if (filter.searchQuery) {
      const queryScore = this.calculateSearchQueryScore(resource, filter.searchQuery);
      if (queryScore === 0) {
        return { matches: false, score: 0, matchedFields: [] };
      }
      score += queryScore;
      matchedFields.push('search');
    }

    // Target groups
    if (filter.targetGroups) {
      let groupScore = 0;
      
      if (filter.targetGroups.countries) {
        const hasCountryMatch = filter.targetGroups.countries.some(country =>
          resource.targetGroups.countries?.includes(country)
        );
        if (hasCountryMatch) groupScore += 5;
      }

      if (filter.targetGroups.employmentSectors) {
        const hasEmploymentMatch = filter.targetGroups.employmentSectors.some(sector =>
          resource.targetGroups.employmentSectors?.includes(sector)
        );
        if (hasEmploymentMatch) groupScore += 5;
      }

      score += groupScore;
      if (groupScore > 0) matchedFields.push('targetGroups');
    }

    return {
      matches: true,
      score,
      distance,
      matchedFields
    };
  }

  /**
   * Calculate search query relevance score
   */
  private calculateSearchQueryScore(resource: MentalHealthResource, query: string): number {
    const normalizedQuery = query.toLowerCase();
    let score = 0;

    // Check name (highest weight)
    if (resource.name.en.toLowerCase().includes(normalizedQuery)) score += 30;

    // Check description
    if (resource.description.en.toLowerCase().includes(normalizedQuery)) score += 20;

    // Check services
    resource.servicesOffered.forEach(service => {
      if (service.service.en.toLowerCase().includes(normalizedQuery)) score += 15;
    });

    // Check tags and keywords
    if (resource.searchKeywords.en?.some(keyword => 
      keyword.toLowerCase().includes(normalizedQuery)
    )) score += 10;

    if (resource.tags.some(tag => 
      tag.toLowerCase().includes(normalizedQuery)
    )) score += 10;

    return score;
  }

  /**
   * Calculate distance between two points in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Sort search results
   */
  private sortSearchResults(
    results: ResourceSearchResult[], 
    sortBy: string, 
    order: 'asc' | 'desc'
  ): ResourceSearchResult[] {
    return results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'rating':
          comparison = a.resource.qualityMetrics.averageRating - b.resource.qualityMetrics.averageRating;
          break;
        case 'distance':
          comparison = (a.distance || 0) - (b.distance || 0);
          break;
        case 'name':
          comparison = a.resource.name.en.localeCompare(b.resource.name.en);
          break;
        case 'recently_added':
          comparison = new Date(a.resource.lastUpdated).getTime() - new Date(b.resource.lastUpdated).getTime();
          break;
        case 'availability':
          comparison = (a.isCurrentlyOpen ? 1 : 0) - (b.isCurrentlyOpen ? 1 : 0);
          break;
        default:
          comparison = b.relevanceScore - a.relevanceScore;
      }

      return order === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Update search index for faster searching
   */
  private updateSearchIndex(resource: MentalHealthResource): void {
    const words = [
      ...resource.name.en.toLowerCase().split(/\s+/),
      ...resource.description.en.toLowerCase().split(/\s+/),
      ...resource.tags.map(tag => tag.toLowerCase()),
      ...(resource.searchKeywords.en || []).map(keyword => keyword.toLowerCase())
    ];

    words.forEach(word => {
      if (word.length > 2) { // Ignore very short words
        if (!this.searchIndex.has(word)) {
          this.searchIndex.set(word, new Set());
        }
        this.searchIndex.get(word)!.add(resource.id);
      }
    });
  }

  /**
   * Build initial search index
   */
  private buildSearchIndex(): void {
    this.searchIndex.clear();
    for (const resource of this.resources.values()) {
      this.updateSearchIndex(resource);
    }
  }

  /**
   * Update resource quality metrics based on feedback
   */
  private updateResourceQualityMetrics(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    const feedbacks = this.feedback.get(resourceId);
    
    if (!resource || !feedbacks || feedbacks.length === 0) return;

    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = totalRating / feedbacks.length;

    resource.qualityMetrics.averageRating = Math.round(averageRating * 10) / 10;
    resource.qualityMetrics.totalReviews = feedbacks.length;
    resource.lastUpdated = new Date().toISOString();

    this.resources.set(resourceId, resource);
  }

  /**
   * Initialize utilization tracking for a resource
   */
  private initializeUtilizationTracking(resourceId: string): void {
    if (!this.utilization.has(resourceId)) {
      this.utilization.set(resourceId, []);
    }
  }

  /**
   * Calculate top demographics from utilization data
   */
  private calculateTopDemographics(utilizations: ResourceUtilization[]): any {
    const aggregated = {
      by_country: {} as Record<string, number>,
      by_age_group: {} as Record<string, number>,
      by_employment: {} as Record<string, number>,
      by_language: {} as Record<string, number>
    };

    utilizations.forEach(util => {
      Object.entries(util.demographicBreakdown.by_country).forEach(([key, value]) => {
        aggregated.by_country[key] = (aggregated.by_country[key] || 0) + value;
      });
      Object.entries(util.demographicBreakdown.by_age_group).forEach(([key, value]) => {
        aggregated.by_age_group[key] = (aggregated.by_age_group[key] || 0) + value;
      });
      Object.entries(util.demographicBreakdown.by_employment).forEach(([key, value]) => {
        aggregated.by_employment[key] = (aggregated.by_employment[key] || 0) + value;
      });
      Object.entries(util.demographicBreakdown.by_language).forEach(([key, value]) => {
        aggregated.by_language[key] = (aggregated.by_language[key] || 0) + value;
      });
    });

    return {
      topCountry: this.getTopEntry(aggregated.by_country),
      topAgeGroup: this.getTopEntry(aggregated.by_age_group),
      topEmployment: this.getTopEntry(aggregated.by_employment),
      topLanguage: this.getTopEntry(aggregated.by_language)
    };
  }

  /**
   * Get the top entry from a demographics object
   */
  private getTopEntry(obj: Record<string, number>): { key: string; value: number } | null {
    const entries = Object.entries(obj);
    if (entries.length === 0) return null;

    const sorted = entries.sort(([,a], [,b]) => b - a);
    return { key: sorted[0][0], value: sorted[0][1] };
  }

  /**
   * Calculate trends from utilization data
   */
  private calculateTrends(utilizations: ResourceUtilization[]): any {
    if (utilizations.length < 2) return null;

    const sorted = utilizations.sort((a, b) => a.date.localeCompare(b.date));
    const recent = sorted.slice(-7); // Last 7 days
    const previous = sorted.slice(-14, -7); // Previous 7 days

    const recentAvg = recent.reduce((sum, u) => sum + u.metrics.views, 0) / recent.length;
    const previousAvg = previous.length > 0 
      ? previous.reduce((sum, u) => sum + u.metrics.views, 0) / previous.length 
      : 0;

    const trend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

    return {
      viewsTrend: trend,
      direction: trend > 5 ? 'increasing' : trend < -5 ? 'decreasing' : 'stable',
      recentAverage: recentAvg,
      previousAverage: previousAvg
    };
  }

  /**
   * Initialize sample resources for demonstration
   */
  private initializeSampleResources(): void {
    const sampleResources: MentalHealthResource[] = [
      {
        id: 'dormitory_001',
        name: {
          en: 'Dormitory Mental Health Support Hub',
          zh: '宿舍心理健康支援中心',
          bn: 'ডরমিটরি মানসিক স্বাস্থ্য সহায়তা কেন্দ্র',
          ta: 'தங்குமிட மன நல ஆதரவு மையம்',
          my: 'Pusat Sokongan Kesihatan Mental Asrama',
          idn: 'Pusat Dukungan Kesehatan Mental Asrama'
        },
        description: {
          en: 'On-site mental health support available in worker dormitories with trained peer counselors and regular check-ins.',
          zh: '在工人宿舍提供现场心理健康支持，配备训练有素的同伴咨询师和定期检查。',
          bn: 'প্রশিক্ষিত সহকর্মী পরামর্শদাতা এবং নিয়মিত চেক-ইনের সাথে শ্রমিক হোস্টেলে অন-সাইট মানসিক স্বাস্থ্য সহায়তা উপলব্ধ।',
          ta: 'பயிற்சி பெற்ற சகாக்களின் ஆலோசকர்கள் மற்றும் வழக்கமான சோதனைகளுடன் தொழிலாளர் விடுதிகளில் நேரில் மன நல ஆதரவு கிடைக்கிறது।',
          my: 'Sokongan kesihatan mental di tapak tersedia di asrama pekerja dengan kaunselor rakan sebaya yang terlatih dan pemeriksaan berkala.',
          idn: 'Dukungan kesehatan mental di tempat tersedia di asrama pekerja dengan konselor sebaya terlatih dan pemeriksaan rutin.'
        },
        category: 'dormitory-based',
        contactInfo: [
          {
            method: 'phone',
            value: '+65-6234-5678',
            isPrimary: true,
            description: 'Main helpline - 24/7',
            languages: ['en', 'zh', 'bn', 'ta']
          },
          {
            method: 'whatsapp',
            value: '+65-9234-5678',
            isPrimary: false,
            description: 'WhatsApp support',
            languages: ['en', 'bn', 'ta', 'my', 'idn']
          }
        ],
        location: {
          address: {
            en: 'Block 123, Dormitory Complex, Industrial Area',
            zh: '工业区宿舍群123栋',
            bn: 'ব্লক ১২৩, হোস্টেল কমপ্লেক্স, শিল্প এলাকা',
            ta: 'பிளாக் 123, விடுதி வளாகம், தொழில்துறை பகுதி',
            my: 'Blok 123, Kompleks Asrama, Kawasan Perindustrian',
            idn: 'Blok 123, Kompleks Asrama, Kawasan Industri'
          },
          coordinates: {
            latitude: 1.3521,
            longitude: 103.8198
          },
          nearbyLandmarks: {
            en: 'Near MRT Station and Shopping Center',
            zh: '靠近地铁站和购物中心',
            bn: 'এমআরটি স্টেশন এবং শপিং সেন্টারের কাছে',
            ta: 'MRT நிலையம் மற்றும் வணிக மையத்திற்கு அருகில்',
            my: 'Berhampiran Stesen MRT dan Pusat Membeli-belah',
            idn: 'Dekat Stasiun MRT dan Pusat Perbelanjaan'
          },
          transportationInfo: {
            en: 'Free shuttle bus every 30 minutes',
            zh: '每30分钟免费班车',
            bn: 'প্রতি ৩০ মিনিটে বিনামূল্যে শাটল বাস',
            ta: 'ஒவ்வொரு 30 நிமிடங்களுக்கும் இலவச ஷட்டில் பேருந்து',
            my: 'Bas ulang-alik percuma setiap 30 minit',
            idn: 'Bus antar jemput gratis setiap 30 menit'
          }
        },
        schedule: [
          {
            day: 'monday',
            isOpen: true,
            timeSlots: [
              { start: '09:00', end: '17:00' },
              { start: '19:00', end: '21:00' }
            ]
          },
          {
            day: 'tuesday',
            isOpen: true,
            timeSlots: [
              { start: '09:00', end: '17:00' },
              { start: '19:00', end: '21:00' }
            ]
          },
          {
            day: 'wednesday',
            isOpen: true,
            timeSlots: [
              { start: '09:00', end: '17:00' },
              { start: '19:00', end: '21:00' }
            ]
          },
          {
            day: 'thursday',
            isOpen: true,
            timeSlots: [
              { start: '09:00', end: '17:00' },
              { start: '19:00', end: '21:00' }
            ]
          },
          {
            day: 'friday',
            isOpen: true,
            timeSlots: [
              { start: '09:00', end: '17:00' },
              { start: '19:00', end: '21:00' }
            ]
          },
          {
            day: 'saturday',
            isOpen: true,
            timeSlots: [
              { start: '10:00', end: '16:00' }
            ]
          },
          {
            day: 'sunday',
            isOpen: true,
            timeSlots: [
              { start: '10:00', end: '16:00' }
            ]
          }
        ],
        timezone: 'Asia/Singapore',
        servicesOffered: [
          {
            service: {
              en: 'Peer Counseling',
              zh: '同伴咨询',
              bn: 'সহকর্মী পরামর্শ',
              ta: 'சகா ஆலோசனை',
              my: 'Kaunseling Rakan Sebaya',
              idn: 'Konseling Sebaya'
            },
            description: {
              en: 'One-on-one support from trained peer counselors who understand migrant worker experiences',
              zh: '来自了解移工经历的训练有素的同伴咨询师的一对一支持',
              bn: 'প্রবাসী শ্রমিকদের অভিজ্ঞতা বোঝেন এমন প্রশিক্ষিত সহকর্মী পরামর্শদাতাদের কাছ থেকে এক-এর-পর-এক সহায়তা',
              ta: 'புலம்பெயர்ந்த தொழிலாளர்களின் அனுபவங்களைப் புரிந்து கொள்ளும் பயிற்சி பெற்ற சகாக்களின் ஆலோசকர்களிடமிருந்து ஒருவருக்கு ஒருவர் ஆதரவு',
              my: 'Sokongan satu dengan satu daripada kaunselor rakan sebaya terlatih yang memahami pengalaman pekerja migran',
              idn: 'Dukungan satu lawan satu dari konselor sebaya terlatih yang memahami pengalaman pekerja migran'
            },
            languages: ['en', 'zh', 'bn', 'ta', 'my', 'idn'],
            cost: 'free',
            requiresAppointment: false,
            duration: '30-60 minutes'
          }
        ],
        targetGroups: {
          countries: ['Bangladesh', 'India', 'China', 'Philippines', 'Indonesia', 'Myanmar'],
          ageGroups: ['18-25', '26-35', '36-45', '46-55'],
          employmentSectors: ['Construction', 'Manufacturing'],
          languages: ['en', 'zh', 'bn', 'ta', 'my', 'idn'],
          riskLevels: ['minimal', 'mild', 'moderate'],
          specificNeeds: ['homesickness', 'work stress', 'social isolation']
        },
        provider: {
          name: {
            en: 'Worker Welfare Organization',
            zh: '工人福利组织',
            bn: 'শ্রমিক কল্যাণ সংস্থা',
            ta: 'தொழிலாளர் நல அமைப்பு',
            my: 'Organisasi Kebajikan Pekerja',
            idn: 'Organisasi Kesejahteraan Pekerja'
          },
          type: 'ngo',
          credentials: ['Certified Peer Counselors', 'Mental Health First Aid'],
          website: 'https://workersdormitorysupport.org'
        },
        qualityMetrics: {
          averageRating: 4.2,
          totalReviews: 89,
          responseTime: 'immediate',
          waitTime: 'no wait'
        },
        status: 'active',
        verificationStatus: 'verified',
        lastUpdated: new Date().toISOString(),
        addedBy: 'admin_001',
        accessibility: {
          wheelchairAccessible: true,
          hasTranslationServices: true,
          acceptsWalkIns: true,
          requiresReferral: false,
          costInfo: {
            en: 'Completely free service for all dormitory residents',
            zh: '为所有宿舍居民提供完全免费的服务',
            bn: 'সকল হোস্টেল বাসিন্দাদের জন্য সম্পূর্ণ বিনামূল্যে সেবা',
            ta: 'அனைத்து விடுதி குடியிருப்பாளர்களுக்கும் முற்றிலும் இலவச சேவை',
            my: 'Perkhidmatan percuma sepenuhnya untuk semua penghuni asrama',
            idn: 'Layanan sepenuhnya gratis untuk semua penghuni asrama'
          }
        },
        features: {
          hasChildcare: false,
          providesTransportation: false,
          hasOnlineOption: true,
          has24HourSupport: true,
          providesFollowUp: true,
          hasGroupSessions: true,
          hasIndividualSessions: true,
          providesCrisisIntervention: true
        },
        searchKeywords: {
          en: ['dormitory', 'peer support', 'on-site', 'worker housing', 'counseling', 'mental health'],
          zh: ['宿舍', '同伴支持', '现场', '工人住房', '咨询', '心理健康'],
          bn: ['হোস্টেল', 'সহকর্মী সহায়তা', 'অন-সাইট', 'শ্রমিক আবাসন', 'পরামর্শ', 'মানসিক স্বাস্থ্য'],
          ta: ['விடுதி', 'சகா ஆதரவு', 'நேரில்', 'தொழிலாளர் வீட்டுவசதி', 'ஆலோசனை', 'மன நலம்'],
          my: ['asrama', 'sokongan rakan sebaya', 'di tapak', 'perumahan pekerja', 'kaunseling', 'kesihatan mental'],
          idn: ['asrama', 'dukungan sebaya', 'di tempat', 'perumahan pekerja', 'konseling', 'kesehatan mental']
        },
        tags: ['dormitory', 'peer-support', 'on-site', 'multilingual', 'free', '24-7']
      }
      // More sample resources would be added here...
    ];

    sampleResources.forEach(resource => {
      this.addResource(resource);
    });
  }

  /**
   * Get all resources (for admin)
   */
  getAllResources(): MentalHealthResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Delete a resource
   */
  deleteResource(resourceId: string): boolean {
    const deleted = this.resources.delete(resourceId);
    if (deleted) {
      this.feedback.delete(resourceId);
      this.utilization.delete(resourceId);
    }
    return deleted;
  }

  /**
   * Get resource statistics
   */
  getResourceStatistics(): any {
    const resources = Array.from(this.resources.values());
    const categories = new Map<ResourceCategory, number>();
    let totalRating = 0;
    let totalReviews = 0;

    resources.forEach(resource => {
      categories.set(resource.category, (categories.get(resource.category) || 0) + 1);
      totalRating += resource.qualityMetrics.averageRating * resource.qualityMetrics.totalReviews;
      totalReviews += resource.qualityMetrics.totalReviews;
    });

    return {
      totalResources: resources.length,
      activeResources: resources.filter(r => r.status === 'active').length,
      categoriesBreakdown: Object.fromEntries(categories),
      averageRating: totalReviews > 0 ? totalRating / totalReviews : 0,
      totalReviews,
      verifiedResources: resources.filter(r => r.verificationStatus === 'verified').length
    };
  }
}

export default ResourcesDirectoryManager;
