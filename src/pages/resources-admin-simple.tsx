import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import ResourcesDirectoryManager, { 
  MentalHealthResource, 
  ResourceCategory, 
  ContactMethod, 
  AvailabilityDay,
  ResourceLocation,
  MultiLanguageText,
  ContactInfo,
  DaySchedule
} from '../lib/resources-directory';

const ResourcesAdminPage: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const [directoryManager] = useState(() => new ResourcesDirectoryManager());
  const [resources, setResources] = useState<MentalHealthResource[]>([]);
  const [editingResource, setEditingResource] = useState<MentalHealthResource | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'resources' | 'analytics'>('resources');

  // Form state for creating/editing resources
  const [formData, setFormData] = useState<Partial<MentalHealthResource>>({});

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = () => {
    try {
      const allResources = directoryManager.searchResources({}).map(r => r.resource);
      setResources(allResources);
    } catch (error) {
      console.error('Failed to load resources:', error);
    }
  };

  const handleAddResource = () => {
    setEditingResource(null);
    setFormData({
      id: '',
      name: { en: '', zh: '', bn: '', ta: '', my: '', idn: '' },
      description: { en: '', zh: '', bn: '', ta: '', my: '', idn: '' },
      category: 'clinics',
      contactInfo: [],
      location: {
        address: { en: '', zh: '', bn: '', ta: '', my: '', idn: '' },
        coordinates: { latitude: 0, longitude: 0 }
      },
      servicesOffered: [],
      schedule: [],
      features: {
        hasChildcare: false,
        providesTransportation: false,
        hasOnlineOption: false,
        has24HourSupport: false,
        providesFollowUp: false,
        hasGroupSessions: false,
        hasIndividualSessions: false,
        providesCrisisIntervention: false
      },
      qualityMetrics: {
        averageRating: 0,
        totalReviews: 0,
        responseTime: '24 hours',
        waitTime: 'varies'
      },
      tags: []
    });
    setShowAddForm(true);
  };

  const handleEditResource = (resource: MentalHealthResource) => {
    setEditingResource(resource);
    setFormData(resource);
    setShowAddForm(true);
  };

  const handleSaveResource = async () => {
    try {
      if (!formData.id || !formData.name?.en || !formData.category) {
        alert('Please fill in all required fields');
        return;
      }

      const resourceData = {
        ...formData,
        id: formData.id || `resource-${Date.now()}`,
        lastUpdated: new Date().toISOString()
      } as MentalHealthResource;

      if (editingResource) {
        directoryManager.updateResource(resourceData.id, resourceData);
      } else {
        directoryManager.addResource(resourceData);
      }

      loadResources();
      setShowAddForm(false);
      setEditingResource(null);
      setFormData({});
    } catch (error) {
      console.error('Failed to save resource:', error);
      alert('Failed to save resource. Please try again.');
    }
  };

  const updateMultiLanguageText = (field: string, language: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field as keyof typeof prev] as MultiLanguageText || {}),
        [language]: value
      }
    }));
  };

  const addContactInfo = () => {
    setFormData(prev => ({
      ...prev,
      contactInfo: [
        ...(prev.contactInfo || []),
        {
          method: 'phone' as ContactMethod,
          value: '',
          description: '',
          isPrimary: false
        }
      ]
    }));
  };

  const updateContactInfo = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: prev.contactInfo?.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      ) || []
    }));
  };

  const removeContactInfo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: prev.contactInfo?.filter((_, i) => i !== index) || []
    }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: [
        ...(prev.servicesOffered || []),
        {
          service: { en: '', zh: '', bn: '', ta: '', my: '', idn: '' },
          description: { en: '', zh: '', bn: '', ta: '', my: '', idn: '' },
          cost: 'free',
          duration: '',
          requiresAppointment: true,
          languages: ['en']
        }
      ]
    }));
  };

  const updateService = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered?.map((service, i) => 
        i === index ? { ...service, [field]: value } : service
      ) || []
    }));
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered?.filter((_, i) => i !== index) || []
    }));
  };

  const addScheduleDay = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [
        ...(prev.schedule || []),
        {
          day: 'monday' as AvailabilityDay,
          isOpen: true,
          timeSlots: []
        }
      ]
    }));
  };

  const updateScheduleDay = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule?.map((day, i) => 
        i === index ? { ...day, [field]: value } : day
      ) || []
    }));
  };

  const addTimeSlot = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule?.map((day, i) => 
        i === dayIndex 
          ? { 
              ...day, 
              timeSlots: [...day.timeSlots, { start: '09:00', end: '17:00' }] 
            }
          : day
      ) || []
    }));
  };

  const updateTimeSlot = (dayIndex: number, slotIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule?.map((day, i) => 
        i === dayIndex 
          ? {
              ...day,
              timeSlots: day.timeSlots.map((slot, j) => 
                j === slotIndex ? { ...slot, [field]: value } : slot
              )
            }
          : day
      ) || []
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                🏥 Mental Health Resources Admin
              </h1>
              <p className="text-gray-600 mt-1">
                Manage mental health services and resources
              </p>
            </div>
            <button
              onClick={handleAddResource}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              ➕ Add New Resource
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'resources', label: 'Resources', icon: '🏥' },
                { id: 'analytics', label: 'Analytics', icon: '📊' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Resources Tab */}
        {selectedTab === 'resources' && (
          <div className="space-y-6">
            {/* Resources List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">All Resources ({resources.length})</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {resources.map((resource) => (
                      <tr key={resource.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">
                              {resource.category === 'dormitory-based' && '🏠'}
                              {resource.category === 'helplines' && '📞'}
                              {resource.category === 'clinics' && '🏥'}
                              {resource.category === 'online-services' && '💻'}
                              {resource.category === 'peer-support' && '👥'}
                              {resource.category === 'emergency-services' && '🚨'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {resource.name.en}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {resource.description.en}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {resource.category.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            resource.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {resource.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ⭐ {resource.qualityMetrics.averageRating.toFixed(1)} ({resource.qualityMetrics.totalReviews})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(resource.lastUpdated).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditResource(resource)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Edit"
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">🏥</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {resources.length}
                    </div>
                    <div className="text-gray-600">Total Resources</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">✅</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {resources.filter(r => r.status === 'active').length}
                    </div>
                    <div className="text-gray-600">Active Resources</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⭐</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {resources.length > 0 
                        ? (resources.reduce((sum, r) => sum + r.qualityMetrics.averageRating, 0) / resources.length).toFixed(1)
                        : '0.0'
                      }
                    </div>
                    <div className="text-gray-600">Average Rating</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📊</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {resources.reduce((sum, r) => sum + r.qualityMetrics.totalReviews, 0)}
                    </div>
                    <div className="text-gray-600">Total Reviews</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Resources by Category</h3>
              <div className="space-y-3">
                {Object.entries(
                  resources.reduce((acc, resource) => {
                    acc[resource.category] = (acc[resource.category] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="font-medium capitalize">{category.replace('-', ' ')}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / resources.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Resource Modal */}
      {showAddForm && (
        <ResourceFormModal
          resource={formData}
          isEditing={!!editingResource}
          onSave={handleSaveResource}
          onCancel={() => {
            setShowAddForm(false);
            setEditingResource(null);
            setFormData({});
          }}
          updateMultiLanguageText={updateMultiLanguageText}
          addContactInfo={addContactInfo}
          updateContactInfo={updateContactInfo}
          removeContactInfo={removeContactInfo}
          addService={addService}
          updateService={updateService}
          removeService={removeService}
          addScheduleDay={addScheduleDay}
          updateScheduleDay={updateScheduleDay}
          addTimeSlot={addTimeSlot}
          updateTimeSlot={updateTimeSlot}
          setFormData={setFormData}
        />
      )}
    </div>
  );
};

// Resource Form Modal Component
interface ResourceFormModalProps {
  resource: Partial<MentalHealthResource>;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  updateMultiLanguageText: (field: string, language: string, value: string) => void;
  addContactInfo: () => void;
  updateContactInfo: (index: number, field: string, value: any) => void;
  removeContactInfo: (index: number) => void;
  addService: () => void;
  updateService: (index: number, field: string, value: any) => void;
  removeService: (index: number) => void;
  addScheduleDay: () => void;
  updateScheduleDay: (index: number, field: string, value: any) => void;
  addTimeSlot: (dayIndex: number) => void;
  updateTimeSlot: (dayIndex: number, slotIndex: number, field: string, value: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<Partial<MentalHealthResource>>>;
}

const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  resource,
  isEditing,
  onSave,
  onCancel,
  updateMultiLanguageText,
  addContactInfo,
  updateContactInfo,
  removeContactInfo,
  setFormData
}) => {
  const [currentTab, setCurrentTab] = useState<'basic' | 'contact' | 'features'>('basic');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'ta', name: 'தমিழ்' },
    { code: 'my', name: 'မြန်မာ' },
    { code: 'idn', name: 'Bahasa Indonesia' }
  ];

  const categories: ResourceCategory[] = [
    'dormitory-based',
    'helplines', 
    'clinics',
    'online-services',
    'peer-support',
    'government-services',
    'ngo-services',
    'emergency-services'
  ];

  const contactMethods: ContactMethod[] = [
    'phone',
    'whatsapp',
    'email',
    'website',
    'walk-in',
    'appointment',
    'online-chat',
    'video-call'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditing ? 'Edit Resource' : 'Add New Resource'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'basic', label: 'Basic Info', icon: '📝' },
                { id: 'contact', label: 'Contact', icon: '📞' },
                { id: 'features', label: 'Features', icon: '⭐' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    currentTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* Basic Info Tab */}
          {currentTab === 'basic' && (
            <div className="space-y-6">
              {/* Resource ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resource ID *
                </label>
                <input
                  type="text"
                  value={resource.id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="unique-resource-id"
                  disabled={isEditing}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={resource.category || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ResourceCategory }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-language Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resource Name *
                </label>
                <div className="space-y-3">
                  {languages.map(lang => (
                    <div key={lang.code}>
                      <label className="block text-xs text-gray-500 mb-1">{lang.name}</label>
                      <input
                        type="text"
                        value={resource.name?.[lang.code as keyof MultiLanguageText] || ''}
                        onChange={(e) => updateMultiLanguageText('name', lang.code, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Resource name in ${lang.name}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-language Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="space-y-3">
                  {languages.map(lang => (
                    <div key={lang.code}>
                      <label className="block text-xs text-gray-500 mb-1">{lang.name}</label>
                      <textarea
                        value={resource.description?.[lang.code as keyof MultiLanguageText] || ''}
                        onChange={(e) => updateMultiLanguageText('description', lang.code, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Description in ${lang.name}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div className="space-y-3">
                  {languages.map(lang => (
                    <div key={lang.code}>
                      <label className="block text-xs text-gray-500 mb-1">{lang.name}</label>
                      <input
                        type="text"
                        value={resource.location?.address?.[lang.code as keyof MultiLanguageText] || ''}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            location: {
                              ...prev.location,
                              address: {
                                ...(prev.location?.address || {}),
                                [lang.code]: e.target.value
                              }
                            } as ResourceLocation
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Address in ${lang.name}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={resource.location?.coordinates?.latitude || 0}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          coordinates: {
                            ...prev.location?.coordinates,
                            latitude: parseFloat(e.target.value) || 0
                          }
                        } as ResourceLocation
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={resource.location?.coordinates?.longitude || 0}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          coordinates: {
                            ...prev.location?.coordinates,
                            longitude: parseFloat(e.target.value) || 0
                          }
                        } as ResourceLocation
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact Info Tab */}
          {currentTab === 'contact' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <button
                  onClick={addContactInfo}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Contact Method
                </button>
              </div>

              <div className="space-y-4">
                {resource.contactInfo?.map((contact, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Method
                        </label>
                        <select
                          value={contact.method}
                          onChange={(e) => updateContactInfo(index, 'method', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                          {contactMethods.map(method => (
                            <option key={method} value={method}>
                              {method.replace('-', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Value
                        </label>
                        <input
                          type="text"
                          value={contact.value}
                          onChange={(e) => updateContactInfo(index, 'value', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Contact value"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={contact.description || ''}
                          onChange={(e) => updateContactInfo(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Optional description"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={contact.isPrimary || false}
                            onChange={(e) => updateContactInfo(index, 'isPrimary', e.target.checked)}
                            className="mr-2"
                          />
                          Primary
                        </label>
                      </div>
                      
                      <button
                        onClick={() => removeContactInfo(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Tab */}
          {currentTab === 'features' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Resource Features</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(resource.features || {}).map(([feature, enabled]) => (
                  <label key={feature} className="flex items-center p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={enabled || false}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          features: {
                            hasChildcare: false,
                            providesTransportation: false,
                            hasOnlineOption: false,
                            has24HourSupport: false,
                            providesFollowUp: false,
                            hasGroupSessions: false,
                            hasIndividualSessions: false,
                            providesCrisisIntervention: false,
                            ...prev.features,
                            [feature]: e.target.checked
                          }
                        }));
                      }}
                      className="mr-3"
                    />
                    <span className="font-medium">
                      {feature.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={resource.tags?.join(', ') || ''}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                    setFormData(prev => ({ ...prev, tags }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="mental health, counseling, crisis support"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isEditing ? 'Update Resource' : 'Create Resource'}
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

export default ResourcesAdminPage;
