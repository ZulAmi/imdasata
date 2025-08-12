'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Video, 
  Headphones, 
  Download, 
  ExternalLink, 
  Search,
  Filter,
  Star,
  Clock,
  Users,
  Brain,
  Heart,
  Shield
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'audio' | 'app' | 'website' | 'guide';
  category: 'anxiety' | 'depression' | 'stress' | 'mindfulness' | 'crisis' | 'general';
  rating: number;
  duration?: string;
  free: boolean;
  url?: string;
  featured?: boolean;
}

const resources: Resource[] = [
  {
    id: '1',
    title: '5-Minute Breathing Exercise for Anxiety',
    description: 'A quick guided breathing exercise to help reduce anxiety and promote calm.',
    type: 'audio',
    category: 'anxiety',
    rating: 4.8,
    duration: '5 min',
    free: true,
    featured: true
  },
  {
    id: '2',
    title: 'Understanding Depression: A Complete Guide',
    description: 'Comprehensive guide covering symptoms, causes, and treatment options for depression.',
    type: 'article',
    category: 'depression',
    rating: 4.9,
    duration: '15 min read',
    free: true,
    featured: true
  },
  {
    id: '3',
    title: 'Mindfulness Meditation for Beginners',
    description: 'Learn the basics of mindfulness meditation with this beginner-friendly video series.',
    type: 'video',
    category: 'mindfulness',
    rating: 4.7,
    duration: '20 min',
    free: true
  },
  {
    id: '4',
    title: 'Crisis Coping Strategies Workbook',
    description: 'Downloadable workbook with practical strategies for managing mental health crises.',
    type: 'guide',
    category: 'crisis',
    rating: 4.9,
    duration: '30 min',
    free: true,
    featured: true
  },
  {
    id: '5',
    title: 'Daily Mood Tracker App',
    description: 'Track your mood, identify patterns, and build healthy habits with this mobile app.',
    type: 'app',
    category: 'general',
    rating: 4.6,
    free: true
  },
  {
    id: '6',
    title: 'Stress Management Techniques',
    description: 'Evidence-based techniques for managing stress in daily life.',
    type: 'article',
    category: 'stress',
    rating: 4.8,
    duration: '10 min read',
    free: true
  }
];

const categories = [
  { id: 'all', name: 'All Resources', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'anxiety', name: 'Anxiety', icon: <Brain className="w-5 h-5" /> },
  { id: 'depression', name: 'Depression', icon: <Heart className="w-5 h-5" /> },
  { id: 'stress', name: 'Stress', icon: <Shield className="w-5 h-5" /> },
  { id: 'mindfulness', name: 'Mindfulness', icon: <Users className="w-5 h-5" /> },
  { id: 'crisis', name: 'Crisis Support', icon: <Shield className="w-5 h-5" /> },
  { id: 'general', name: 'General Wellness', icon: <Star className="w-5 h-5" /> }
];

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    
    return matchesCategory && matchesSearch && matchesType;
  });

  const featuredResources = resources.filter(r => r.featured);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <BookOpen className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'audio': return <Headphones className="w-5 h-5" />;
      case 'app': return <Download className="w-5 h-5" />;
      case 'guide': return <BookOpen className="w-5 h-5" />;
      default: return <ExternalLink className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-600';
      case 'video': return 'bg-red-100 text-red-600';
      case 'audio': return 'bg-green-100 text-green-600';
      case 'app': return 'bg-purple-100 text-purple-600';
      case 'guide': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mental Health Resources</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access curated mental health resources including articles, videos, apps, and guides 
            to support your wellness journey.
          </p>
        </div>

        {/* Featured Resources */}
        {featuredResources.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Resources</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredResources.map((resource) => (
                <div key={resource.id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-lg ${getTypeColor(resource.type)}`}>
                      {getTypeIcon(resource.type)}
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      Featured
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{resource.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{resource.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">{resource.rating}</span>
                    </div>
                    {resource.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{resource.duration}</span>
                      </div>
                    )}
                  </div>
                  
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    Access Resource
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Type Filter */}
            <div className="lg:w-48">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="article">Articles</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="app">Apps</option>
                <option value="guide">Guides</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg ${getTypeColor(resource.type)}`}>
                  {getTypeIcon(resource.type)}
                </div>
                {resource.free && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Free
                  </span>
                )}
              </div>
              
              <h3 className="font-bold text-lg text-gray-900 mb-2">{resource.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{resource.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-gray-600">{resource.rating}</span>
                </div>
                {resource.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{resource.duration}</span>
                  </div>
                )}
              </div>
              
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors">
                View Resource
              </button>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedType('all');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Additional Support */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need More Support?</h2>
          <p className="text-gray-600 mb-6">
            Can't find what you're looking for? Our AI chat support and crisis resources are always available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/chat"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Chat Support
            </Link>
            <Link 
              href="/crisis"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Crisis Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
