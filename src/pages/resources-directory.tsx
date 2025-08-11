import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import ResourcesDirectoryManager, { 
  ResourceFilter, 
  ResourceSearchResult, 
  ResourceCategory, 
  ContactMethod,
  MentalHealthResource 
} from '../lib/resources-directory';

const ResourcesDirectoryPage: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const [directoryManager] = useState(() => new ResourcesDirectoryManager());
  const [searchResults, setSearchResults] = useState<ResourceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<MentalHealthResource | null>(null);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Filter state
  const [filters, setFilters] = useState<ResourceFilter>({
    categories: [],
    languages: [],
    cost: [],
    searchQuery: '',
    sortBy: 'rating',
    sortOrder: 'desc'
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');

  useEffect(() => {
    // Get user location for distance-based search
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }

    // Initial search with no filters
    performSearch();
  }, []);

  useEffect(() => {
    // Re-search when filters change
    performSearch();
  }, [filters, userLocation]);

  const performSearch = () => {
    setLoading(true);
    try {
      const results = directoryManager.searchResources(filters, userLocation || undefined);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<ResourceFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResourceClick = (resource: MentalHealthResource) => {
    // Track utilization
    directoryManager.trackUtilization(resource.id, 'view', {
      country: 'Singapore', // Would come from user profile
      language: i18n.language
    });
    
    setSelectedResource(resource);
  };

  const handleContactClick = (resource: MentalHealthResource, contactMethod: ContactMethod, contactValue: string) => {
    // Track utilization
    directoryManager.trackUtilization(resource.id, 'contact', {
      country: 'Singapore',
      language: i18n.language
    });

    // Handle different contact methods
    switch (contactMethod) {
      case 'phone':
        window.open(`tel:${contactValue}`);
        break;
      case 'whatsapp':
        const message = encodeURIComponent(`Hi, I found your mental health service on the resources directory. I would like to know more about your services.`);
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

  const handleQRCodeView = (resource: MentalHealthResource) => {
    directoryManager.trackUtilization(resource.id, 'qr_scan');
    setShowQRCode(resource.id);
  };

  const getLocalizedText = (multiLangText: any): string => {
    if (!multiLangText || typeof multiLangText === 'string') return multiLangText || '';
    return multiLangText[i18n.language] || multiLangText.en || '';
  };

  const getCategoryIcon = (category: ResourceCategory): string => {
    const icons = {
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

  const getContactMethodIcon = (method: ContactMethod): string => {
    const icons = {
      'phone': '📞',
      'whatsapp': '💬',
      'email': '📧',
      'website': '🌐',
      'walk-in': '🚶',
      'appointment': '📅',
      'online-chat': '💬',
      'video-call': '📹'
    };
    return icons[method] || '📞';
  };

  const formatAvailability = (resource: MentalHealthResource): string => {
    const todaySchedule = resource.schedule.find(s => {
      const today = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      return s.day === dayNames[today.getDay()];
    });

    if (!todaySchedule || !todaySchedule.isOpen) {
      return 'Closed today';
    }

    if (todaySchedule.timeSlots.length === 0) {
      return 'Open today';
    }

    const slots = todaySchedule.timeSlots.map(slot => `${slot.start}-${slot.end}`).join(', ');
    return `Open today: ${slots}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                🏥 Mental Health Resources Directory
              </h1>
              <p className="text-gray-600 mt-1">
                Find mental health services and support near you
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  ⊞
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  ☰
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1 rounded ${viewMode === 'map' ? 'bg-white shadow-sm' : ''}`}
                >
                  🗺️
                </button>
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                🔍 Filters
                {showFilters && <span className="text-xs">✕</span>}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for mental health services, locations, or specific needs..."
                value={filters.searchQuery || ''}
                onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-3 text-gray-400">
                🔍
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              {loading ? 'Searching...' : `${searchResults.length} resources found`}
              {userLocation && ' (sorted by distance)'}
            </span>
            <div className="flex items-center gap-4">
              <select
                value={filters.sortBy || 'rating'}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="rating">Sort by Rating</option>
                <option value="distance">Sort by Distance</option>
                <option value="name">Sort by Name</option>
                <option value="availability">Sort by Availability</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 bg-white rounded-lg shadow-md p-6 h-fit">
            <h3 className="text-lg font-semibold mb-4">Filter Resources</h3>
            
            {/* Categories */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Categories</h4>
              <div className="space-y-2">
                {(['dormitory-based', 'helplines', 'clinics', 'online-services', 'peer-support', 'emergency-services'] as ResourceCategory[]).map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.categories?.includes(category) || false}
                      onChange={(e) => {
                        const newCategories = e.target.checked
                          ? [...(filters.categories || []), category]
                          : (filters.categories || []).filter(c => c !== category);
                        handleFilterChange({ categories: newCategories });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {getCategoryIcon(category)} {category.replace('-', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Languages</h4>
              <div className="space-y-2">
                {[
                  { code: 'en', name: 'English' },
                  { code: 'zh', name: '中文' },
                  { code: 'bn', name: 'বাংলা' },
                  { code: 'ta', name: 'தமிழ்' },
                  { code: 'my', name: 'မြန်မာ' },
                  { code: 'idn', name: 'Bahasa Indonesia' }
                ].map(lang => (
                  <label key={lang.code} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.languages?.includes(lang.code) || false}
                      onChange={(e) => {
                        const newLanguages = e.target.checked
                          ? [...(filters.languages || []), lang.code]
                          : (filters.languages || []).filter(l => l !== lang.code);
                        handleFilterChange({ languages: newLanguages });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{lang.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cost */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Cost</h4>
              <div className="space-y-2">
                {['free', 'paid', 'sliding-scale'].map(cost => (
                  <label key={cost} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.cost?.includes(cost as any) || false}
                      onChange={(e) => {
                        const newCost = e.target.checked
                          ? [...(filters.cost || []), cost as any]
                          : (filters.cost || []).filter(c => c !== cost);
                        handleFilterChange({ cost: newCost });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{cost.replace('-', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Features</h4>
              <div className="space-y-2">
                {[
                  { key: 'wheelchairAccessible', label: 'Wheelchair Accessible' },
                  { key: 'acceptsWalkIns', label: 'Accepts Walk-ins' },
                  { key: 'hasOnlineOption', label: 'Online Services' },
                  { key: 'has24HourSupport', label: '24/7 Support' },
                  { key: 'providesCrisisIntervention', label: 'Crisis Support' }
                ].map(feature => (
                  <label key={feature.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.features?.[feature.key as keyof typeof filters.features] || false}
                      onChange={(e) => {
                        handleFilterChange({
                          features: {
                            ...filters.features,
                            [feature.key]: e.target.checked
                          }
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{feature.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => setFilters({
                searchQuery: '',
                sortBy: 'rating',
                sortOrder: 'desc'
              })}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Searching resources...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No resources found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
              {searchResults.map((result) => (
                <ResourceCard
                  key={result.resource.id}
                  result={result}
                  viewMode={viewMode}
                  onResourceClick={handleResourceClick}
                  onContactClick={handleContactClick}
                  onQRCodeView={handleQRCodeView}
                  getLocalizedText={getLocalizedText}
                  getCategoryIcon={getCategoryIcon}
                  getContactMethodIcon={getContactMethodIcon}
                  formatAvailability={formatAvailability}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resource Detail Modal */}
      {selectedResource && (
        <ResourceDetailModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onContactClick={handleContactClick}
          onQRCodeView={handleQRCodeView}
          getLocalizedText={getLocalizedText}
          getCategoryIcon={getCategoryIcon}
          getContactMethodIcon={getContactMethodIcon}
          formatAvailability={formatAvailability}
        />
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <QRCodeModal
          resource={searchResults.find(r => r.resource.id === showQRCode)?.resource}
          onClose={() => setShowQRCode(null)}
        />
      )}
    </div>
  );
};

// Resource Card Component
interface ResourceCardProps {
  result: ResourceSearchResult;
  viewMode: 'grid' | 'list' | 'map';
  onResourceClick: (resource: MentalHealthResource) => void;
  onContactClick: (resource: MentalHealthResource, method: ContactMethod, value: string) => void;
  onQRCodeView: (resource: MentalHealthResource) => void;
  getLocalizedText: (text: any) => string;
  getCategoryIcon: (category: ResourceCategory) => string;
  getContactMethodIcon: (method: ContactMethod) => string;
  formatAvailability: (resource: MentalHealthResource) => string;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  result,
  viewMode,
  onResourceClick,
  onContactClick,
  onQRCodeView,
  getLocalizedText,
  getCategoryIcon,
  getContactMethodIcon,
  formatAvailability
}) => {
  const { resource, distance, isCurrentlyOpen } = result;

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
           onClick={() => onResourceClick(resource)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getCategoryIcon(resource.category)}</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {getLocalizedText(resource.name)}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {resource.category.replace('-', ' ')}
                  </span>
                  {isCurrentlyOpen && (
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Open Now
                    </span>
                  )}
                  {distance && (
                    <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {distance.toFixed(1)} km away
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mb-3 line-clamp-2">
              {getLocalizedText(resource.description)}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>⭐ {resource.qualityMetrics.averageRating.toFixed(1)} ({resource.qualityMetrics.totalReviews})</span>
              <span>🕒 {formatAvailability(resource)}</span>
              <span>💰 {resource.servicesOffered[0]?.cost || 'varies'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {resource.contactInfo.slice(0, 2).map((contact, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onContactClick(resource, contact.method, contact.value);
                }}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                title={contact.description}
              >
                {getContactMethodIcon(contact.method)}
              </button>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQRCodeView(resource);
              }}
              className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="View QR Code"
            >
              📱
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
         onClick={() => onResourceClick(resource)}>
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
                  Open
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
          <span>⭐ {resource.qualityMetrics.averageRating.toFixed(1)}</span>
          <span>💰 {resource.servicesOffered[0]?.cost || 'varies'}</span>
          {distance && <span>{distance.toFixed(1)} km</span>}
        </div>

        {/* Contact Methods */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {resource.contactInfo.slice(0, 3).map((contact, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onContactClick(resource, contact.method, contact.value);
                }}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                title={contact.description}
              >
                {getContactMethodIcon(contact.method)}
              </button>
            ))}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQRCodeView(resource);
            }}
            className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            title="QR Code"
          >
            📱
          </button>
        </div>
      </div>
    </div>
  );
};

// Resource Detail Modal Component
interface ResourceDetailModalProps {
  resource: MentalHealthResource;
  onClose: () => void;
  onContactClick: (resource: MentalHealthResource, method: ContactMethod, value: string) => void;
  onQRCodeView: (resource: MentalHealthResource) => void;
  getLocalizedText: (text: any) => string;
  getCategoryIcon: (category: ResourceCategory) => string;
  getContactMethodIcon: (method: ContactMethod) => string;
  formatAvailability: (resource: MentalHealthResource) => string;
}

const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  onClose,
  onContactClick,
  onQRCodeView,
  getLocalizedText,
  getCategoryIcon,
  getContactMethodIcon,
  formatAvailability
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{getCategoryIcon(resource.category)}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {getLocalizedText(resource.name)}
                </h2>
                <p className="text-gray-600 mt-1">
                  {getLocalizedText(resource.description)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {resource.category.replace('-', ' ')}
                  </span>
                  <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    ⭐ {resource.qualityMetrics.averageRating.toFixed(1)} ({resource.qualityMetrics.totalReviews} reviews)
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
              <div className="space-y-3">
                {resource.contactInfo.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getContactMethodIcon(contact.method)}</span>
                      <div>
                        <div className="font-medium">{contact.value}</div>
                        {contact.description && (
                          <div className="text-sm text-gray-600">{contact.description}</div>
                        )}
                        {contact.languages && (
                          <div className="text-xs text-gray-500">
                            Languages: {contact.languages.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onContactClick(resource, contact.method, contact.value)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Contact
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Offered */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Services Offered</h3>
              <div className="space-y-3">
                {resource.servicesOffered.map((service, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="font-medium">{getLocalizedText(service.service)}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {getLocalizedText(service.description)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>💰 {service.cost}</span>
                      {service.duration && <span>⏱️ {service.duration}</span>}
                      <span>📋 {service.requiresAppointment ? 'Appointment required' : 'Walk-ins welcome'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Availability Schedule */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Availability</h3>
              <div className="space-y-2">
                {resource.schedule.map((day, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded">
                    <span className="font-medium capitalize">{day.day}</span>
                    <span className="text-sm">
                      {day.isOpen ? (
                        day.timeSlots.length > 0 ? (
                          day.timeSlots.map(slot => `${slot.start}-${slot.end}`).join(', ')
                        ) : 'Open'
                      ) : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            {resource.location && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Location</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{getLocalizedText(resource.location.address)}</div>
                  {resource.location.nearbyLandmarks && (
                    <div className="text-sm text-gray-600 mt-1">
                      🗺️ {getLocalizedText(resource.location.nearbyLandmarks)}
                    </div>
                  )}
                  {resource.location.transportationInfo && (
                    <div className="text-sm text-gray-600 mt-1">
                      🚌 {getLocalizedText(resource.location.transportationInfo)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Features</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(resource.features).map(([feature, available]) => (
                  available && (
                    <div key={feature} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{feature.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase())}</span>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* QR Code */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Quick Access</h3>
              <button
                onClick={() => onQRCodeView(resource)}
                className="w-full bg-gray-100 hover:bg-gray-200 transition-colors p-4 rounded-lg flex items-center justify-center gap-2"
              >
                <span className="text-2xl">📱</span>
                <span>Generate QR Code for Easy Sharing</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// QR Code Modal Component
interface QRCodeModalProps {
  resource?: MentalHealthResource;
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ resource, onClose }) => {
  if (!resource) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
        <h3 className="text-lg font-semibold mb-4">QR Code for {resource.name.en}</h3>
        
        {resource.qrCode && (
          <div className="mb-4">
            <img 
              src={resource.qrCode.imageUrl} 
              alt="QR Code"
              className="mx-auto mb-4"
            />
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code to quickly access this resource on your mobile device
            </p>
            <div className="bg-gray-50 p-3 rounded text-xs font-mono break-all">
              {resource.qrCode.url}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              if (resource.qrCode) {
                navigator.clipboard.writeText(resource.qrCode.url);
              }
            }}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Copy Link
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
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

export default ResourcesDirectoryPage;
