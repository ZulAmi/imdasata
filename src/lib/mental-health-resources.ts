import { MentalHealthResource } from './ai-recommendation-engine';

/**
 * Comprehensive database of mental health resources for migrant workers
 * Includes therapy, self-help, peer support, crisis intervention, and wellness resources
 */
export const mentalHealthResources: MentalHealthResource[] = [
  // Crisis and Emergency Resources
  {
    id: 'crisis_001',
    type: 'crisis',
    title: 'Singapore Samaritans Crisis Hotline',
    description: '24/7 confidential emotional support for people in crisis',
    content: {
      text: 'Immediate emotional support available 24/7. Trained volunteers provide confidential listening and crisis intervention.',
      url: 'https://www.samaritans.org.sg'
    },
    metadata: {
      languages: ['en', 'zh', 'my', 'ta'],
      culturalContext: ['Singapore', 'Malaysia', 'India', 'China'],
      targetDemographics: {
        countries: ['Singapore', 'Malaysia']
      },
      riskLevels: ['severe'],
      tags: ['24/7', 'crisis', 'immediate', 'confidential', 'multilingual'],
      difficulty: 'beginner',
      duration: 30,
      format: 'individual'
    },
    effectiveness: {
      averageRating: 4.7,
      totalRatings: 892,
      completionRate: 0.95,
      improvementScore: 4.2
    },
    availability: {
      locations: ['Singapore'],
      cost: 'free',
      accessRequirements: [],
      waitTime: 0
    },
    provider: {
      name: 'Samaritans of Singapore',
      type: 'ngo',
      credentials: ['Crisis Intervention Training', 'Suicide Prevention Certified'],
      contact: {
        phone: '1-767',
        email: 'pat@samaritans.org.sg',
        website: 'https://www.samaritans.org.sg'
      }
    }
  },

  {
    id: 'crisis_002',
    type: 'crisis',
    title: 'Dubai Mental Health Crisis Support',
    description: 'Crisis intervention services for migrant workers in UAE',
    content: {
      text: 'Specialized crisis support understanding the unique challenges faced by migrant workers in the UAE.',
      url: 'https://dha.gov.ae/mental-health'
    },
    metadata: {
      languages: ['en', 'bn', 'idn', 'ta'],
      culturalContext: ['Bangladesh', 'Indonesia', 'India', 'Philippines'],
      targetDemographics: {
        employmentSectors: ['Construction', 'Domestic Work', 'Service'],
        countries: ['UAE', 'Saudi Arabia', 'Qatar']
      },
      riskLevels: ['severe'],
      tags: ['crisis', 'migrant-specific', 'multilingual', 'culturally-aware'],
      difficulty: 'beginner',
      duration: 45,
      format: 'individual'
    },
    effectiveness: {
      averageRating: 4.5,
      totalRatings: 234,
      completionRate: 0.88,
      improvementScore: 4.0
    },
    availability: {
      locations: ['UAE'],
      cost: 'free',
      accessRequirements: [],
      waitTime: 0
    },
    provider: {
      name: 'Dubai Health Authority',
      type: 'government',
      credentials: ['Licensed Mental Health Professionals', 'Crisis Intervention Specialists'],
      contact: {
        phone: '+971-4-123-4567',
        email: 'mentalhealth@dha.gov.ae'
      }
    }
  },

  // Professional Therapy Services
  {
    id: 'therapy_001',
    type: 'therapy',
    title: 'Multilingual Therapy for Migrant Workers',
    description: 'Professional counseling services designed specifically for the migrant worker community',
    content: {
      text: 'Individual and group therapy sessions with therapists who understand the unique challenges of working abroad, family separation, and cultural adaptation.',
      url: 'https://migranttherapy.org'
    },
    metadata: {
      languages: ['en', 'zh', 'bn', 'ta', 'my', 'idn'],
      culturalContext: ['Bangladesh', 'India', 'Philippines', 'Indonesia', 'Myanmar', 'China'],
      targetDemographics: {
        employmentSectors: ['Construction', 'Domestic Work', 'Manufacturing', 'Service', 'Healthcare'],
        ageGroups: ['18-25', '26-35', '36-45', '46-55'],
        countries: ['Singapore', 'Malaysia', 'UAE', 'Saudi Arabia', 'Qatar']
      },
      riskLevels: ['mild', 'moderate', 'severe'],
      tags: ['professional', 'culturally-sensitive', 'trauma-informed', 'family-issues', 'work-stress'],
      difficulty: 'beginner',
      duration: 60,
      format: 'individual'
    },
    effectiveness: {
      averageRating: 4.6,
      totalRatings: 156,
      completionRate: 0.82,
      improvementScore: 3.8
    },
    availability: {
      locations: ['Singapore', 'Malaysia', 'UAE'],
      cost: 'free',
      accessRequirements: ['appointment', 'registration'],
      waitTime: 7
    },
    provider: {
      name: 'Migrant Mental Health Collective',
      type: 'ngo',
      credentials: ['Licensed Clinical Psychologists', 'Cultural Competency Training', 'Trauma Specialists'],
      contact: {
        phone: '+65-1234-5678',
        email: 'therapy@mmhc.org',
        whatsapp: '+65-1234-5678',
        website: 'https://migranttherapy.org'
      }
    }
  },

  {
    id: 'therapy_002',
    type: 'therapy',
    title: 'Family Separation Counseling',
    description: 'Specialized therapy for dealing with family separation and long-distance relationships',
    content: {
      text: 'Support for the emotional challenges of being away from family, maintaining relationships across distances, and coping with loneliness.',
      steps: [
        'Initial assessment of family situation',
        'Developing coping strategies for loneliness',
        'Communication skills for long-distance relationships',
        'Managing guilt and family expectations',
        'Planning for reunification or visits'
      ]
    },
    metadata: {
      languages: ['en', 'bn', 'idn', 'ta'],
      culturalContext: ['Bangladesh', 'Indonesia', 'India', 'Philippines'],
      targetDemographics: {
        employmentSectors: ['Construction', 'Domestic Work', 'Manufacturing'],
        ageGroups: ['26-35', '36-45', '46-55'],
        genders: ['male', 'female']
      },
      riskLevels: ['mild', 'moderate'],
      tags: ['family-separation', 'relationships', 'loneliness', 'communication'],
      difficulty: 'intermediate',
      duration: 75,
      format: 'individual'
    },
    effectiveness: {
      averageRating: 4.4,
      totalRatings: 89,
      completionRate: 0.79,
      improvementScore: 3.5
    },
    availability: {
      locations: ['Singapore', 'Malaysia', 'UAE', 'Saudi Arabia'],
      cost: 'low',
      accessRequirements: ['appointment'],
      waitTime: 5
    },
    provider: {
      name: 'Family Connection Therapy Center',
      type: 'private',
      credentials: ['Family Therapists', 'Relationship Counselors'],
      contact: {
        email: 'family@connectiontherapy.org',
        website: 'https://familyconnection.org'
      }
    }
  },

  // Self-Help Resources
  {
    id: 'selfhelp_001',
    type: 'self-help',
    title: 'Daily Mindfulness for Migrant Workers',
    description: 'Guided mindfulness exercises designed for busy work schedules and shared living spaces',
    content: {
      text: 'Short, practical mindfulness exercises that can be done during work breaks or in shared accommodations.',
      audioUrl: 'https://mindfulness-audio.org/migrant-workers',
      steps: [
        '5-minute morning breathing exercise',
        'Mindful walking during breaks',
        'Body scan for physical tension relief',
        'Gratitude practice before sleep',
        'Stress-relief techniques for difficult days'
      ]
    },
    metadata: {
      languages: ['en', 'zh', 'bn', 'ta', 'my', 'idn'],
      culturalContext: ['Bangladesh', 'India', 'Philippines', 'Indonesia', 'Myanmar', 'China'],
      targetDemographics: {
        employmentSectors: ['Construction', 'Manufacturing', 'Service'],
        ageGroups: ['18-25', '26-35', '36-45']
      },
      riskLevels: ['minimal', 'mild', 'moderate'],
      tags: ['mindfulness', 'stress-relief', 'short-sessions', 'practical', 'audio-guided'],
      difficulty: 'beginner',
      duration: 15,
      format: 'individual'
    },
    effectiveness: {
      averageRating: 4.3,
      totalRatings: 324,
      completionRate: 0.71,
      improvementScore: 2.8
    },
    availability: {
      locations: ['Global'],
      cost: 'free',
      accessRequirements: ['smartphone', 'headphones'],
      waitTime: 0
    },
    provider: {
      name: 'Mindful Workers Initiative',
      type: 'ngo',
      credentials: ['Certified Mindfulness Instructors', 'Occupational Wellness Specialists'],
      contact: {
        email: 'info@mindfulworkers.org',
        website: 'https://mindfulworkers.org'
      }
    }
  },

  {
    id: 'selfhelp_002',
    type: 'self-help',
    title: 'Financial Stress Management Toolkit',
    description: 'Practical tools for managing anxiety about money, remittances, and financial goals',
    content: {
      text: 'Comprehensive guide to managing financial stress, budgeting for remittances, and planning for the future.',
      url: 'https://financial-wellness.org/migrant-toolkit',
      steps: [
        'Understanding your financial triggers',
        'Creating a realistic budget with remittances',
        'Building emergency savings strategies',
        'Communicating with family about money',
        'Long-term financial planning techniques'
      ]
    },
    metadata: {
      languages: ['en', 'bn', 'idn', 'ta'],
      culturalContext: ['Bangladesh', 'Indonesia', 'India', 'Philippines'],
      targetDemographics: {
        employmentSectors: ['Construction', 'Domestic Work', 'Manufacturing', 'Service'],
        ageGroups: ['26-35', '36-45', '46-55']
      },
      riskLevels: ['mild', 'moderate'],
      tags: ['financial-stress', 'budgeting', 'remittances', 'family-support', 'practical'],
      difficulty: 'intermediate',
      duration: 30,
      format: 'text'
    },
    effectiveness: {
      averageRating: 4.2,
      totalRatings: 198,
      completionRate: 0.68,
      improvementScore: 3.1
    },
    availability: {
      locations: ['Global'],
      cost: 'free',
      accessRequirements: ['internet'],
      waitTime: 0
    },
    provider: {
      name: 'Financial Wellness for Workers',
      type: 'ngo',
      credentials: ['Financial Counselors', 'Mental Health Advocates'],
      contact: {
        email: 'support@financialwellness.org',
        website: 'https://financial-wellness.org'
      }
    }
  },

  // Peer Support Resources
  {
    id: 'peer_001',
    type: 'peer-support',
    title: 'Virtual Support Groups for Migrant Workers',
    description: 'Online support groups connecting workers from similar backgrounds and experiences',
    content: {
      text: 'Facilitated online groups where migrant workers can share experiences, offer mutual support, and learn from each other.',
      url: 'https://peer-support.org/groups'
    },
    metadata: {
      languages: ['en', 'zh', 'bn', 'ta', 'my', 'idn'],
      culturalContext: ['Bangladesh', 'India', 'Philippines', 'Indonesia', 'Myanmar', 'China'],
      targetDemographics: {
        employmentSectors: ['Construction', 'Domestic Work', 'Manufacturing', 'Service'],
        ageGroups: ['18-25', '26-35', '36-45', '46-55']
      },
      riskLevels: ['minimal', 'mild', 'moderate'],
      tags: ['peer-support', 'group-therapy', 'community', 'shared-experiences', 'virtual'],
      difficulty: 'beginner',
      duration: 90,
      format: 'group'
    },
    effectiveness: {
      averageRating: 4.5,
      totalRatings: 267,
      completionRate: 0.73,
      improvementScore: 3.3
    },
    availability: {
      locations: ['Global'],
      cost: 'free',
      accessRequirements: ['internet', 'video-call-capable-device'],
      waitTime: 2
    },
    provider: {
      name: 'Global Worker Support Network',
      type: 'community',
      credentials: ['Peer Support Specialists', 'Group Facilitators'],
      contact: {
        email: 'groups@workersupport.org',
        website: 'https://peer-support.org'
      }
    }
  },

  {
    id: 'peer_002',
    type: 'peer-support',
    title: 'Buddy System for New Workers',
    description: 'Pairing experienced workers with newcomers for mentorship and emotional support',
    content: {
      text: 'Structured mentorship program connecting experienced migrant workers with those who are new to working abroad.',
      steps: [
        'Initial matching based on background and location',
        'Orientation session for mentors and mentees',
        'Regular check-in schedule',
        'Resource sharing and practical advice',
        'Long-term friendship development'
      ]
    },
    metadata: {
      languages: ['en', 'zh', 'bn', 'ta', 'my', 'idn'],
      culturalContext: ['Bangladesh', 'India', 'Philippines', 'Indonesia', 'Myanmar', 'China'],
      targetDemographics: {
        employmentSectors: ['Construction', 'Domestic Work', 'Manufacturing'],
        ageGroups: ['18-25', '26-35']
      },
      riskLevels: ['minimal', 'mild'],
      tags: ['mentorship', 'newcomer-support', 'practical-advice', 'friendship', 'cultural-adaptation'],
      difficulty: 'beginner',
      duration: 45,
      format: 'individual'
    },
    effectiveness: {
      averageRating: 4.4,
      totalRatings: 143,
      completionRate: 0.81,
      improvementScore: 2.9
    },
    availability: {
      locations: ['Singapore', 'Malaysia', 'UAE', 'Saudi Arabia'],
      cost: 'free',
      accessRequirements: ['registration', 'background-check'],
      waitTime: 10
    },
    provider: {
      name: 'Worker Buddy Network',
      type: 'community',
      credentials: ['Mentor Training Certified', 'Cultural Competency Training'],
      contact: {
        email: 'buddies@workernetwork.org',
        whatsapp: '+65-9876-5432'
      }
    }
  },

  // Wellness and Prevention Resources
  {
    id: 'wellness_001',
    type: 'wellness',
    title: 'Physical Exercise for Mental Health',
    description: 'Exercise routines designed for small spaces and busy schedules to improve mental wellbeing',
    content: {
      videoUrl: 'https://exercise-wellness.org/migrant-fitness',
      text: 'Simple exercise routines that can be done in dormitories or small spaces to boost mood and reduce stress.',
      steps: [
        '10-minute morning energy routine',
        'Stress-relief stretches for after work',
        'Bodyweight exercises for strength',
        'Relaxation and cool-down techniques',
        'Weekend longer workout options'
      ]
    },
    metadata: {
      languages: ['en', 'zh', 'bn', 'ta', 'my', 'idn'],
      culturalContext: ['Bangladesh', 'India', 'Philippines', 'Indonesia', 'Myanmar', 'China'],
      targetDemographics: {
        employmentSectors: ['Construction', 'Manufacturing', 'Service'],
        ageGroups: ['18-25', '26-35', '36-45']
      },
      riskLevels: ['minimal', 'mild'],
      tags: ['exercise', 'physical-wellness', 'stress-relief', 'small-spaces', 'video-guided'],
      difficulty: 'beginner',
      duration: 20,
      format: 'video'
    },
    effectiveness: {
      averageRating: 4.1,
      totalRatings: 456,
      completionRate: 0.64,
      improvementScore: 2.5
    },
    availability: {
      locations: ['Global'],
      cost: 'free',
      accessRequirements: ['smartphone', 'small-exercise-space'],
      waitTime: 0
    },
    provider: {
      name: 'Wellness for Workers Foundation',
      type: 'ngo',
      credentials: ['Certified Fitness Instructors', 'Mental Health Advocates'],
      contact: {
        email: 'fitness@wellnessworkers.org',
        website: 'https://exercise-wellness.org'
      }
    }
  },

  {
    id: 'wellness_002',
    type: 'wellness',
    title: 'Nutrition and Mental Health Guide',
    description: 'Affordable nutrition tips for maintaining mental wellness on a budget',
    content: {
      text: 'Practical nutrition advice for maintaining mental health with affordable foods available in local markets.',
      url: 'https://nutrition-mental.org/migrant-guide',
      steps: [
        'Brain-healthy foods on a budget',
        'Meal planning for shift workers',
        'Cooking in shared kitchens',
        'Supplements for mental wellness',
        'Hydration and mental clarity'
      ]
    },
    metadata: {
      languages: ['en', 'bn', 'idn', 'ta'],
      culturalContext: ['Bangladesh', 'Indonesia', 'India', 'Philippines'],
      targetDemographics: {
        employmentSectors: ['Construction', 'Domestic Work', 'Manufacturing'],
        ageGroups: ['26-35', '36-45', '46-55']
      },
      riskLevels: ['minimal', 'mild'],
      tags: ['nutrition', 'budget-friendly', 'practical', 'brain-health', 'cooking'],
      difficulty: 'beginner',
      duration: 25,
      format: 'text'
    },
    effectiveness: {
      averageRating: 3.9,
      totalRatings: 234,
      completionRate: 0.59,
      improvementScore: 2.2
    },
    availability: {
      locations: ['Global'],
      cost: 'free',
      accessRequirements: ['internet'],
      waitTime: 0
    },
    provider: {
      name: 'Nutrition for Mental Health Initiative',
      type: 'ngo',
      credentials: ['Registered Dietitians', 'Mental Health Nutritionists'],
      contact: {
        email: 'nutrition@mentalhealth.org',
        website: 'https://nutrition-mental.org'
      }
    }
  },

  // Educational Resources
  {
    id: 'education_001',
    type: 'educational',
    title: 'Understanding Mental Health: A Guide for Workers',
    description: 'Comprehensive educational resource about mental health, stigma, and when to seek help',
    content: {
      text: 'Educational content covering mental health basics, recognizing signs of distress, and understanding available support options.',
      url: 'https://mental-health-education.org/workers',
      steps: [
        'What is mental health?',
        'Common mental health challenges for migrant workers',
        'Recognizing warning signs in yourself and others',
        'Understanding different types of help available',
        'Overcoming stigma and cultural barriers to seeking help'
      ]
    },
    metadata: {
      languages: ['en', 'zh', 'bn', 'ta', 'my', 'idn'],
      culturalContext: ['Bangladesh', 'India', 'Philippines', 'Indonesia', 'Myanmar', 'China'],
      targetDemographics: {
        employmentSectors: ['Construction', 'Domestic Work', 'Manufacturing', 'Service'],
        ageGroups: ['18-25', '26-35', '36-45', '46-55']
      },
      riskLevels: ['minimal', 'mild'],
      tags: ['education', 'mental-health-literacy', 'stigma-reduction', 'awareness', 'prevention'],
      difficulty: 'beginner',
      duration: 40,
      format: 'text'
    },
    effectiveness: {
      averageRating: 4.2,
      totalRatings: 567,
      completionRate: 0.72,
      improvementScore: 2.1
    },
    availability: {
      locations: ['Global'],
      cost: 'free',
      accessRequirements: ['literacy', 'internet'],
      waitTime: 0
    },
    provider: {
      name: 'Mental Health Literacy Project',
      type: 'ngo',
      credentials: ['Mental Health Educators', 'Public Health Specialists'],
      contact: {
        email: 'education@mhliteracy.org',
        website: 'https://mental-health-education.org'
      }
    }
  },

  // Specialized Resources for Domestic Workers
  {
    id: 'domestic_001',
    type: 'therapy',
    title: 'Support for Domestic Workers',
    description: 'Specialized counseling for domestic workers dealing with isolation and workplace challenges',
    content: {
      text: 'Therapy services specifically designed for domestic workers, addressing unique challenges like social isolation, employer relationships, and lack of privacy.',
      steps: [
        'Building coping strategies for isolation',
        'Managing difficult employer relationships',
        'Maintaining personal boundaries',
        'Dealing with homesickness in live-in situations',
        'Planning for time off and social connections'
      ]
    },
    metadata: {
      languages: ['en', 'idn', 'ta', 'my'],
      culturalContext: ['Indonesia', 'Philippines', 'India', 'Myanmar'],
      targetDemographics: {
        employmentSectors: ['Domestic Work'],
        genders: ['female'],
        ageGroups: ['18-25', '26-35', '36-45']
      },
      riskLevels: ['mild', 'moderate', 'severe'],
      tags: ['domestic-work', 'isolation', 'workplace-stress', 'employer-relations', 'privacy'],
      difficulty: 'intermediate',
      duration: 60,
      format: 'individual'
    },
    effectiveness: {
      averageRating: 4.6,
      totalRatings: 78,
      completionRate: 0.84,
      improvementScore: 4.1
    },
    availability: {
      locations: ['Singapore', 'UAE', 'Saudi Arabia'],
      cost: 'free',
      accessRequirements: ['appointment', 'confidential-location'],
      waitTime: 5
    },
    provider: {
      name: 'Domestic Workers Support Centre',
      type: 'ngo',
      credentials: ['Licensed Therapists', 'Domestic Worker Advocates'],
      contact: {
        phone: '+65-6123-4567',
        email: 'support@domesticworkers.org',
        website: 'https://domesticworkerssupport.org'
      }
    }
  },

  // Construction Worker Specific Resources
  {
    id: 'construction_001',
    type: 'wellness',
    title: 'Mental Wellness for Construction Workers',
    description: 'Workplace mental health program designed for the construction industry',
    content: {
      text: 'Mental wellness program addressing job-related stress, safety concerns, physical demands, and team dynamics in construction work.',
      steps: [
        'Managing work-related stress and pressure',
        'Dealing with safety anxiety and workplace accidents',
        'Building positive relationships with coworkers',
        'Coping with physical fatigue and mental tiredness',
        'Balancing dangerous work with mental wellness'
      ]
    },
    metadata: {
      languages: ['en', 'bn', 'zh', 'ta'],
      culturalContext: ['Bangladesh', 'India', 'China'],
      targetDemographics: {
        employmentSectors: ['Construction'],
        genders: ['male'],
        ageGroups: ['18-25', '26-35', '36-45', '46-55']
      },
      riskLevels: ['mild', 'moderate'],
      tags: ['construction', 'workplace-safety', 'physical-demands', 'team-dynamics', 'stress-management'],
      difficulty: 'intermediate',
      duration: 35,
      format: 'group'
    },
    effectiveness: {
      averageRating: 4.0,
      totalRatings: 189,
      completionRate: 0.67,
      improvementScore: 2.8
    },
    availability: {
      locations: ['Singapore', 'Malaysia', 'UAE'],
      cost: 'free',
      accessRequirements: ['workplace-participation'],
      waitTime: 7
    },
    provider: {
      name: 'Construction Workers Mental Health Initiative',
      type: 'ngo',
      credentials: ['Occupational Health Specialists', 'Mental Health Counselors'],
      contact: {
        email: 'construction@workerhealth.org',
        website: 'https://constructionmentalhealth.org'
      }
    }
  }
];

export default mentalHealthResources;
