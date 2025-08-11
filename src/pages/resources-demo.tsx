import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import ResourcesDirectoryManager, { ResourceSearchResult } from '../lib/resources-directory';

const ResourcesDirectoryDemo: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const [directoryManager] = useState(() => new ResourcesDirectoryManager());
  const [searchResults, setSearchResults] = useState<ResourceSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initial load of all resources
    performSearch();
  }, []);

  const performSearch = () => {
    setLoading(true);
    try {
      const results = directoryManager.searchResources({
        searchQuery,
        categories: selectedCategory ? [selectedCategory as any] : undefined,
        sortBy: 'rating',
        sortOrder: 'desc'
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setTimeout(performSearch, 100);
  };

  const trackUtilization = (resourceId: string, action: 'view' | 'contact' | 'qr_scan') => {
    directoryManager.trackUtilization(resourceId, action, {
      country: 'Singapore',
      language: i18n.language
    });
  };

  const getLocalizedText = (multiLangText: any): string => {
    if (!multiLangText || typeof multiLangText === 'string') return multiLangText || '';
    return multiLangText[i18n.language] || multiLangText.en || '';
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      'dormitory-based': '🏠',
      'helplines': '📞',
      'clinics': '🏥',
      'online-services': '💻',
      'peer-support': '👥',
      'government-services': '🏛️',
      'ngo-services': '🤝',
      'emergency-services': '🚨'
    };
    return icons[category] || '💡';
  };

  const formatAvailability = (resource: any): string => {
    if (!resource.schedule || resource.schedule.length === 0) {
      return 'Contact for availability';
    }

    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todaySchedule = resource.schedule.find((s: any) => 
      s.day === dayNames[today.getDay()]
    );

    if (!todaySchedule || !todaySchedule.isOpen) {
      return 'Closed today';
    }

    if (todaySchedule.timeSlots.length === 0) {
      return 'Open today';
    }

    const slots = todaySchedule.timeSlots.map((slot: any) => `${slot.start}-${slot.end}`).join(', ');
    return `Open today: ${slots}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🏥 Mental Health Resources Directory
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Find mental health services and support for migrant workers in Singapore
            </p>
            
            {/* Search Section */}
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search for mental health services, locations, or specific needs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  🔍 Search
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === '' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Categories
                </button>
                {[
                  { id: 'dormitory-based', label: 'Dormitory Services', icon: '🏠' },
                  { id: 'helplines', label: 'Helplines', icon: '📞' },
                  { id: 'clinics', label: 'Clinics', icon: '🏥' },
                  { id: 'online-services', label: 'Online Services', icon: '💻' },
                  { id: 'peer-support', label: 'Peer Support', icon: '👥' },
                  { id: 'emergency-services', label: 'Emergency', icon: '🚨' }
                ].map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                      selectedCategory === category.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <span>{category.icon}</span>
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results Summary */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              {loading ? 'Searching...' : `${searchResults.length} Resources Found`}
            </h2>
            <div className="text-sm text-gray-600">
              {selectedCategory && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  Category: {selectedCategory.replace('-', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching resources...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && searchResults.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No resources found</h3>
            <p className="text-gray-600">Try adjusting your search terms or category filter</p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((result) => (
              <ResourceCard
                key={result.resource.id}
                result={result}
                onUtilizationTrack={trackUtilization}
                getLocalizedText={getLocalizedText}
                getCategoryIcon={getCategoryIcon}
                formatAvailability={formatAvailability}
              />
            ))}
          </div>
        )}

        {/* Demo Information */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            🚀 Demo Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">Features Demonstrated:</h4>
              <ul className="space-y-1">
                <li>• Multi-language resource descriptions</li>
                <li>• Category-based filtering</li>
                <li>• Search functionality</li>
                <li>• Real-time availability status</li>
                <li>• Contact information with multiple methods</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Supported Categories:</h4>
              <ul className="space-y-1">
                <li>• Dormitory-based services</li>
                <li>• 24/7 Helplines</li>
                <li>• Mental health clinics</li>
                <li>• Online services</li>
                <li>• Peer support groups</li>
                <li>• Emergency services</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Resource Card Component
interface ResourceCardProps {
  result: ResourceSearchResult;
  onUtilizationTrack: (resourceId: string, action: 'view' | 'contact' | 'qr_scan') => void;
  getLocalizedText: (text: any) => string;
  getCategoryIcon: (category: string) => string;
  formatAvailability: (resource: any) => string;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  result,
  onUtilizationTrack,
  getLocalizedText,
  getCategoryIcon,
  formatAvailability
}) => {
  const { resource, distance, isCurrentlyOpen } = result;

  const handleContact = (contactMethod: string, contactValue: string) => {
    onUtilizationTrack(resource.id, 'contact');
    
    switch (contactMethod) {
      case 'phone':
        window.open(`tel:${contactValue}`);
        break;
      case 'whatsapp':
        const message = encodeURIComponent('Hi, I found your mental health service. I would like to know more.');
        window.open(`https://wa.me/${contactValue.replace('+', '')}?text=${message}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:${contactValue}`);
        break;
      case 'website':
        window.open(contactValue, '_blank');
        break;
    }
  };

  const handleQRView = () => {
    onUtilizationTrack(resource.id, 'qr_scan');
    alert(`QR Code for ${getLocalizedText(resource.name)}\nImplementation: Generate QR code for mobile access`);
  };

  const handleViewDetails = () => {
    onUtilizationTrack(resource.id, 'view');
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleViewDetails}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{getCategoryIcon(resource.category)}</span>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 line-clamp-2">
              {getLocalizedText(resource.name)}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {resource.category.replace('-', ' ')}
              </span>
              {isCurrentlyOpen && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Open Now
                </span>
              )}
              {distance && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {distance.toFixed(1)} km
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {getLocalizedText(resource.description)}
        </p>

        {/* Metrics */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>⭐ {resource.qualityMetrics.averageRating.toFixed(1)} ({resource.qualityMetrics.totalReviews})</span>
          <span>🕒 {formatAvailability(resource)}</span>
        </div>

        {/* Contact Methods */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {resource.contactInfo.slice(0, 3).map((contact, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleContact(contact.method, contact.value);
                }}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                title={`${contact.method}: ${contact.value}`}
              >
                {contact.method === 'phone' && '📞'}
                {contact.method === 'whatsapp' && '💬'}
                {contact.method === 'email' && '📧'}
                {contact.method === 'website' && '🌐'}
                {contact.method === 'walk-in' && '🚶'}
                {contact.method === 'appointment' && '📅'}
              </button>
            ))}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleQRView();
            }}
            className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            title="QR Code"
          >
            📱
          </button>
        </div>

        {/* Services Preview */}
        {resource.servicesOffered && resource.servicesOffered.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Services:</h4>
            <div className="flex flex-wrap gap-1">
              {resource.servicesOffered.slice(0, 3).map((service, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                >
                  {getLocalizedText(service.service)}
                </span>
              ))}
              {resource.servicesOffered.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{resource.servicesOffered.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};

export default ResourcesDirectoryDemo;
