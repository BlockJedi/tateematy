import React, { useState, useEffect } from 'react';
import { 
  User, 
  Plus, 
  Download, 
  Bell,
  Shield, 
  Award, 
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Eye,
  X,
  Loader,
  FileText,
  Coins
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { userAPI, childAPI } from '../lib/api';
import VaccinationProgress from '../components/VaccinationProgress';
import ChildSelector from '../components/ChildSelector';
import SelectedChildProgress from '../components/SelectedChildProgress';
import VaccinationRecords from '../components/VaccinationRecords';
import CertificateManager from '../components/CertificateManager';
import TokenRewards from '../components/TokenRewards';

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showEditChildModal, setShowEditChildModal] = useState(false);
  const [showViewChildModal, setShowViewChildModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [editingChild, setEditingChild] = useState<any>(null);
  const [viewingChild, setViewingChild] = useState<any>(null);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [newChild, setNewChild] = useState({
    childId: '',
    name: '',
    dateOfBirth: '',
    gender: '',
    birthCertificateNumber: '',
    bloodType: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  // Real data state
  const [children, setChildren] = useState<any[]>([]);
  const [vaccinationRecords, setVaccinationRecords] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Profile state - using real user data
  const [profile, setProfile] = useState({
    name: user?.fullName || 'Loading...',
    id: user?.nationalId || 'Loading...',
    mobile: user?.mobile || 'Loading...',
    walletAddress: user?.walletAddress || 'Loading...',
    email: user?.email || 'Loading...',
    address: user?.address?.city || 'Loading...'
  });

  // Fetch data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !user.userType) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        // Fetch user statistics
        const statsResponse = await userAPI.getStatistics();
        if (statsResponse.success) {
          setStatistics(statsResponse.data.statistics);
        }
        
        // Fetch user's children
        const childrenResponse = await userAPI.getChildren();
        console.log('Children API response:', childrenResponse); // Debug log
        console.log('Children response data structure:', JSON.stringify(childrenResponse.data, null, 2)); // Detailed structure
        if (childrenResponse.success) {
          // Ensure children is always an array
          const childrenData = childrenResponse.data;
          if (Array.isArray(childrenData)) {
            setChildren(childrenData);
          } else if (childrenData && Array.isArray(childrenData.children)) {
            setChildren(childrenData.children);
          } else if (childrenData && Array.isArray(childrenData.data)) {
            setChildren(childrenData.data);
          } else {
            console.warn('Children data is not in expected format:', childrenData);
            setChildren([]);
          }
        } else {
          console.warn('Children API failed:', childrenResponse);
          setChildren([]);
        }
        
        // TODO: Add vaccination records and reminders API calls
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Update profile when user data changes
  useEffect(() => {
    if (user && user.userType) {
      setProfile({
        name: user.fullName || 'Not provided',
        id: user.nationalId || 'Not provided',
        mobile: user.mobile || 'Not provided',
        walletAddress: user.walletAddress || 'Not provided',
        email: user.email || 'Not provided',
        address: user.address?.city || 'Not provided'
      });
    }
  }, [user]);

  // Helper function to check if child is newborn (0-12 months)
  const isNewborn = (dateOfBirth: string) => {
    if (!dateOfBirth) return false;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                        (today.getMonth() - birthDate.getMonth());
    return ageInMonths <= 12;
  };

  // Function to download vaccination certificate
  const downloadCertificate = (record: any) => {
    // TODO: Implement certificate download
    console.log('Downloading certificate for:', record);
    // This would typically generate and download a PDF certificate
  };

  const handleAddChild = () => {
    setShowAddChildModal(true);
  };

  const handleSubmitAddChild = async () => {
    try {
      // Validate required fields
      if (!newChild.name || !newChild.dateOfBirth || !newChild.gender || !newChild.birthCertificateNumber) {
        alert('Please fill in all required fields including birth certificate number');
        return;
      }

      // Validate newborn age requirement
      if (!isNewborn(newChild.dateOfBirth)) {
        alert('Only newborns (0-12 months old) can be registered in this system');
        return;
      }

      // Prepare child data for API
      const childData = {
        fullName: newChild.name,
        dateOfBirth: newChild.dateOfBirth,
        gender: newChild.gender,
        birthCertificateNumber: newChild.birthCertificateNumber,
        bloodType: newChild.bloodType || undefined,
        nationality: 'Saudi' // Default nationality
      };

      console.log('Submitting child data:', childData);

      // Call API to add child
      const response = await childAPI.add(childData);
      
      if (response.success) {
        console.log('Child added successfully:', response.data);
        
        // Refresh children list using the same endpoint as initial load
        console.log('Calling userAPI.getChildren() to refresh list...');
        const childrenResponse = await userAPI.getChildren();
        console.log('Children API response:', childrenResponse);
        
        if (childrenResponse.success) {
          // Use the same logic as initial load to handle data structure
          const childrenData = childrenResponse.data;
          if (Array.isArray(childrenData)) {
            setChildren(childrenData);
          } else if (childrenData && Array.isArray(childrenData.children)) {
            setChildren(childrenData.children);
          } else if (childrenData && Array.isArray(childrenData.data)) {
            setChildren(childrenData.data);
          } else {
            console.warn('Children data is not in expected format:', childrenData);
            setChildren([]);
          }
        } else {
          console.error('Failed to refresh children list:', childrenResponse);
        }
        
                // Reset form and close modal
        setNewChild({
          childId: '',
          name: '',
          dateOfBirth: '',
          gender: '',
          birthCertificateNumber: '',
          bloodType: '',
          emergencyContact: '',
          emergencyPhone: ''
        });
        
        // Reset selected child to show the new child's progress
        if (response.data && response.data._id) {
          setSelectedChild(response.data);
        }
        
        setShowAddChildModal(false);
        
        // Show success message
        alert(`Child added successfully`);
        
        // Force a re-render by updating the children state
        console.log('Refreshing children list...');
        console.log('Current children state:', children);
      } else {
        console.error('Failed to add child:', response);
        alert(`Failed to add child: ${response.message}`);
      }
    } catch (error: any) {
      console.error('Error adding child:', error);
      alert(`Error adding child: ${error.message}`);
    }
  };

  const handleEditChild = (child: any) => {
    setEditingChild(child);
    setShowEditChildModal(true);
  };

  const handleViewChild = (child: any) => {
    setViewingChild(child);
    setShowViewChildModal(true);
  };

  const handleEditProfile = () => {
    setShowEditProfileModal(true);
  };

  const getAgeFromDate = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                       (today.getMonth() - birthDate.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} month${ageInMonths > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      if (months === 0) {
        return `${years} year${years > 1 ? 's' : ''}`;
      } else {
        return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'upcoming':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Safety check for user object
  if (!user || !user.userType) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">User information not available</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-moh-green text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-moh-green animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-moh-green text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Parent Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {profile.name}. Manage your children's vaccination records and stay updated.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-moh-green rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-gray-600">National ID: {profile.id}</p>
                <p className="text-gray-600">Mobile: {profile.mobile}</p>
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={handleEditProfile}
                className="mb-3 bg-moh-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                Edit Profile
              </button>
              <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
              <p className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                {profile.walletAddress.slice(0, 10)}...{profile.walletAddress.slice(-8)}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-moh-green shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('children')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'children'
                ? 'bg-white text-moh-green shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Children
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'records'
                ? 'bg-white text-moh-green shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Vaccination Records
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'reminders'
                ? 'bg-white text-moh-green shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Reminders
          </button>

          <button
            onClick={() => setActiveTab('vaccination-progress')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'vaccination-progress'
                ? 'bg-white text-moh-green shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Vaccination Progress
          </button>
          <button
            onClick={() => setActiveTab('token-rewards')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'token-rewards'
                ? 'bg-white text-moh-green shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Token Rewards
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Children</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics?.totalChildren || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Vaccinations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.totalVaccinations || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.completionRate || 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">School Ready</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.schoolReadyChildren || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Children Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Children Summary</h3>
                <button
                  onClick={handleAddChild}
                  className="bg-moh-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Child
                </button>
              </div>
              
              {children.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No children added yet</p>
                  <button
                    onClick={handleAddChild}
                    className="bg-moh-green text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add Your First Child
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(children) && children.map((child) => (
                    <div key={child._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-moh-green/10 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-moh-green" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{child.fullName}</h4>
                          <p className="text-sm text-gray-600">
                            {child.dateOfBirth ? getAgeFromDate(child.dateOfBirth) : 'Age not set'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(child.vaccinationStatus?.status || 'upcoming')}`}>
                          {child.vaccinationStatus?.status || 'upcoming'}
                        </span>
                        <button
                          onClick={() => handleViewChild(child)}
                          className="text-moh-green hover:text-green-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {children.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('vaccination-progress')}
                    className="flex items-center justify-center p-4 bg-gradient-to-r from-moh-green to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Shield className="w-6 h-6 mr-3" />
                    <span className="font-medium">View Vaccination Progress</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('reminders')}
                    className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Bell className="w-6 h-6 mr-3" />
                    <span className="font-medium">Check Reminders</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Children Tab */}
        {activeTab === 'children' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Children</h2>
              <button
                onClick={handleAddChild}
                className="bg-moh-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Child
              </button>
            </div>
            
            {(!children || !Array.isArray(children) || children.length === 0) ? (
              <div className="text-center py-12">
                <User className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No children yet</h3>
                <p className="text-gray-500 mb-6">Start by adding your first child to track their vaccinations</p>
                <button
                  onClick={handleAddChild}
                  className="bg-moh-green text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors text-lg"
                >
                  Add Child
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(children) && children.map((child) => (
                  <div key={child._id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-moh-green/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-moh-green" />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewChild(child)}
                          className="text-moh-green hover:text-green-600 p-1"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditChild(child)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{child.fullName}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Age: {child.dateOfBirth ? getAgeFromDate(child.dateOfBirth) : 'Not set'}</p>
                      <p>Gender: {child.gender || 'Not set'}</p>
                      <p>Blood Type: {child.bloodType || 'Not set'}</p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Vaccination Progress</span>
                        <span className="text-sm font-medium text-gray-900">
                          {child.vaccinationStatus?.completed || 0}/{child.vaccinationStatus?.totalRequired || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-moh-green h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${child.vaccinationStatus?.totalRequired ? 
                              (child.vaccinationStatus.completed / child.vaccinationStatus.totalRequired) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Certificate Management Section */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-900">Certificates</span>
                        <button
                          onClick={() => {
                            setSelectedChild(child);
                            setShowCertificateModal(true);
                          }}
                          className="text-sm text-moh-green hover:text-green-600 font-medium"
                        >
                          Manage
                        </button>
                      </div>
                      
                      {/* Quick Certificate Status */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Progress Certificate</span>
                          <span className="text-green-600">✓ Available</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">School Readiness</span>
                          <span className={`text-xs ${Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30)) >= 72 ? 'text-green-600' : 'text-gray-400'}`}>
                            {Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30)) >= 72 ? '✓ Available' : '⏳ Age 6+'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Completion</span>
                          <span className={`text-xs ${Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30)) >= 216 ? 'text-green-600' : 'text-gray-400'}`}>
                            {Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30)) >= 216 ? '✓ Available' : '⏳ Age 18+'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vaccination Records Tab */}
        {activeTab === 'records' && (
          <div className="space-y-6">
            {children.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="text-center py-12">
                  <Shield className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No children found</h3>
                  <p className="text-gray-500">Add a child to view vaccination records</p>
                  <button
                    onClick={() => setShowAddChildModal(true)}
                    className="mt-4 bg-moh-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add Child
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Enhanced Vaccination Records Component */}
                <VaccinationRecords
                  children={children}
                  showChildSelector={children.length > 1}
                  selectedChildId={selectedChild?._id || ''}
                  onChildSelect={(childId) => {
                    const child = children.find(c => c._id === childId);
                    setSelectedChild(child || null);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Reminders Tab */}
        {activeTab === 'reminders' && (
          <div className="space-y-6">
            {children.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="text-center py-12">
                  <Bell className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No children found</h3>
                  <p className="text-gray-500">Add a child to view vaccination reminders</p>
                  <button
                    onClick={() => setShowAddChildModal(true)}
                    className="mt-4 bg-moh-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add Child
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Reminders Summary */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Vaccination Reminders</h2>
                  
                  {/* Reminder Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
                        <div>
                          <p className="text-sm text-red-600">Overdue</p>
                          <p className="text-2xl font-bold text-red-900">
                            {children.reduce((total, child) => total + (child.vaccinationStatus?.overdue || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="w-8 h-8 text-yellow-600 mr-3" />
                        <div>
                          <p className="text-sm text-yellow-600">Due Soon</p>
                          <p className="text-2xl font-bold text-yellow-900">
                            {children.reduce((total, child) => total + (child.vaccinationStatus?.pending || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm text-green-600">Completed</p>
                          <p className="text-2xl font-bold text-green-900">
                            {children.reduce((total, child) => total + (child.vaccinationStatus?.completed || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Reminders List */}
                  <div className="space-y-4">
                    {children.map((child) => {
                      const overdueCount = child.vaccinationStatus?.overdue || 0;
                      const pendingCount = child.vaccinationStatus?.pending || 0;
                      
                      if (overdueCount === 0 && pendingCount === 0) {
                        return null; // Skip children with no reminders
                      }
                      
                      return (
                        <div key={child._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">{child.fullName}</h3>
                            <span className="text-sm text-gray-500">
                              Age: {getAgeFromDate(child.dateOfBirth)}
                            </span>
                          </div>
                          
                          {/* Overdue Vaccines */}
                          {overdueCount > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center mb-2">
                                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                                <span className="text-sm font-medium text-red-700">Overdue Vaccines ({overdueCount})</span>
                              </div>
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-700">
                                  ⚠️ {overdueCount} vaccine{overdueCount !== 1 ? 's' : ''} {overdueCount !== 1 ? 'are' : 'is'} overdue. 
                                  Please schedule an appointment with your healthcare provider immediately.
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Due Soon Vaccines */}
                          {pendingCount > 0 && (
                            <div>
                              <div className="flex items-center mb-2">
                                <Clock className="w-4 h-4 text-yellow-600 mr-2" />
                                <span className="text-sm font-medium text-yellow-700">Due Soon ({pendingCount})</span>
                              </div>
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm text-yellow-700">
                                  📅 {pendingCount} vaccine{pendingCount !== 1 ? 's' : ''} {pendingCount !== 1 ? 'are' : 'is'} due soon. 
                                  Schedule an appointment within the next 2 weeks.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* No Reminders Message */}
                    {children.every(child => 
                      (child.vaccinationStatus?.overdue || 0) === 0 && 
                      (child.vaccinationStatus?.pending || 0) === 0
                    ) && (
                      <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                        <p className="text-gray-500">No overdue or upcoming vaccinations at this time.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vaccination Progress Tab */}
        {activeTab === 'vaccination-progress' && (
          <div className="space-y-6">
            {children.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="text-center py-12">
                  <Shield className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No children found</h3>
                  <p className="text-gray-500">Add a child to view their vaccination progress</p>
                  <button
                    onClick={() => setShowAddChildModal(true)}
                    className="mt-4 bg-moh-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add Child
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Child Selector */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Child</h3>
                  <ChildSelector 
                    children={children} 
                    selectedChild={selectedChild}
                    onChildSelect={setSelectedChild}
                  />
                </div>

                {/* Selected Child Progress */}
                {selectedChild && (
                  <SelectedChildProgress child={selectedChild} />
                )}

                {/* No Child Selected Message */}
                {!selectedChild && children.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a child above to view their detailed vaccination progress</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Token Rewards Tab */}
        {activeTab === 'token-rewards' && (
          <div className="space-y-6">
            {children.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="text-center py-12">
                  <Coins className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No children found</h3>
                  <p className="text-gray-500">Add a child to start earning token rewards</p>
                  <button
                    onClick={() => setShowAddChildModal(true)}
                    className="mt-4 bg-moh-green text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add Child
                  </button>
                </div>
              </div>
            ) : (
              <TokenRewards 
                children={children}
                selectedChildId={selectedChild?._id}
              />
            )}
          </div>
        )}

        {/* Add Child Modal */}
        {showAddChildModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New Child</h3>
                <button
                  onClick={() => setShowAddChildModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newChild.name}
                    onChange={(e) => setNewChild({...newChild, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    placeholder="Enter child's full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    value={newChild.dateOfBirth}
                    onChange={(e) => setNewChild({...newChild, dateOfBirth: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    <strong>⚠️ Newborn Only:</strong> This system supports only babies 0-12 months old
                  </p>
                  {newChild.dateOfBirth && (
                    <p className={`text-xs mt-1 ${isNewborn(newChild.dateOfBirth) ? 'text-green-600' : 'text-red-600'}`}>
                      {isNewborn(newChild.dateOfBirth) 
                        ? '✅ Eligible for registration' 
                        : '❌ Child must be 12 months or younger to register'
                      }
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={newChild.gender}
                    onChange={(e) => setNewChild({...newChild, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Certificate Number *</label>
                  <input
                    type="text"
                    value={newChild.birthCertificateNumber}
                    onChange={(e) => setNewChild({...newChild, birthCertificateNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    placeholder="Enter 10-digit birth certificate number"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">Required: 10-digit birth certificate number</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                  <select
                    value={newChild.bloodType}
                    onChange={(e) => setNewChild({...newChild, bloodType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  >
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddChildModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAddChild}
                  disabled={!newChild.name || !newChild.dateOfBirth || !newChild.gender || !newChild.birthCertificateNumber}
                  className="flex-1 bg-moh-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Child
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Child Modal */}
        {showEditChildModal && editingChild && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Child</h3>
                <button
                  onClick={() => setShowEditChildModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingChild.fullName || ''}
                    onChange={(e) => setEditingChild({...editingChild, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editingChild.dateOfBirth ? editingChild.dateOfBirth.split('T')[0] : ''}
                    onChange={(e) => setEditingChild({...editingChild, dateOfBirth: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={editingChild.gender || ''}
                    onChange={(e) => setEditingChild({...editingChild, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                  <select
                    value={editingChild.bloodType || ''}
                    onChange={(e) => setEditingChild({...editingChild, bloodType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  >
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEditChildModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement update child API call
                    setShowEditChildModal(false);
                  }}
                  className="flex-1 bg-moh-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Update Child
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Child Modal */}
        {showViewChildModal && viewingChild && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Child Details</h3>
                <button
                  onClick={() => setShowViewChildModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-moh-green/10 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-moh-green" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{viewingChild.fullName}</h4>
                    <p className="text-gray-600">Child ID: {viewingChild.childId}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <p className="text-gray-900">{viewingChild.dateOfBirth ? new Date(viewingChild.dateOfBirth).toLocaleDateString() : 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <p className="text-gray-900">{viewingChild.dateOfBirth ? getAgeFromDate(viewingChild.dateOfBirth) : 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <p className="text-gray-900 capitalize">{viewingChild.gender || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                    <p className="text-gray-900">{viewingChild.bloodType || 'Not set'}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h5 className="font-medium text-gray-900 mb-2">Vaccination Status</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Completed</span>
                      <span className="text-sm font-medium text-gray-900">
                        {viewingChild.vaccinationStatus?.completed || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Required</span>
                      <span className="text-sm font-medium text-gray-900">
                        {viewingChild.vaccinationStatus?.totalRequired || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-moh-green h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${viewingChild.vaccinationStatus?.totalRequired ? 
                            (viewingChild.vaccinationStatus.completed / viewingChild.vaccinationStatus.totalRequired) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowViewChildModal(false);
                    handleEditChild(viewingChild);
                  }}
                  className="flex-1 bg-moh-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Edit Child
                </button>
                <button
                  onClick={() => setShowViewChildModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Management Modal */}
        {showCertificateModal && selectedChild && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Vaccination Certificates - {selectedChild.fullName}
                </h3>
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Age: {getAgeFromDate(selectedChild.dateOfBirth)}</span>
                  <span>Gender: {selectedChild.gender}</span>
                  <span>Progress: {selectedChild.vaccinationStatus?.completed || 0}/{selectedChild.vaccinationStatus?.totalRequired || 0}</span>
                </div>
              </div>
              
              <CertificateManager
                childId={selectedChild._id}
                childName={selectedChild.fullName}
                childAge={Math.floor((Date.now() - new Date(selectedChild.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30))}
              />
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={profile.mobile}
                    onChange={(e) => setProfile({...profile, mobile: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement update profile API call
                    setShowEditProfileModal(false);
                  }}
                  className="flex-1 bg-moh-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
