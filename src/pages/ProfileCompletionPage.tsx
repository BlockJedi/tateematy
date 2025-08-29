import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { userAPI } from '../lib/api';
import { User, Save, ArrowRight, CheckCircle } from 'lucide-react';

interface FormData {
  fullName: string;
  email: string;
  mobile: string;
  nationalId: string;
  address: {
    city: string;
    street: string;
    postalCode: string;
  };
}

const ProfileCompletionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState('');
  const [completedUserData, setCompletedUserData] = useState<any>(null);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    mobile: '',
    nationalId: '',
    address: {
      city: '',
      street: '',
      postalCode: ''
    }
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    // Pre-fill form with existing data
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      mobile: user.mobile || '',
      nationalId: user.nationalId || '',
      address: {
        city: user.address?.city || '',
        street: user.address?.street || '',
        postalCode: user.address?.postalCode || ''
      }
    });
  }, [user, navigate]);

  // Watch for profile completion and navigate when userType is available
  useEffect(() => {
    if (isCompleted && completedUserData && completedUserData.userType) {
      console.log('🚀 Profile completed, navigating to dashboard with userType:', completedUserData.userType);
      
      // Navigate based on userType
      if (completedUserData.userType === 'parent') {
        navigate('/parent');}
      // } else if (completedUserData.userType === 'healthcare_provider') {
      //   navigate('/healthcare-provider');
      // }
       else {
        // Fallback to parent dashboard
        console.log('⚠️ Unknown userType, falling back to parent dashboard');
        navigate('/parent');
      }
    }
  }, [isCompleted, completedUserData, navigate]);

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'address') {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate required fields
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      setError('Full name is required and must be at least 2 characters');
      setIsLoading(false);
      return;
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Valid email address is required');
      setIsLoading(false);
      return;
    }

    if (!formData.mobile || !/^(\+966|966|0)?5\d{8}$/.test(formData.mobile)) {
      setError('Valid Saudi mobile number is required (e.g., +966501234567)');
      setIsLoading(false);
      return;
    }

    if (!formData.nationalId || !/^\d{10}$/.test(formData.nationalId)) {
      setError('Valid 10-digit National ID is required');
      setIsLoading(false);
      return;
    }

    try {
      // Update user profile
      const response = await userAPI.updateProfile({
        ...formData,
        profileComplete: true
      });

      if (response.success) {
        // Backend returns { success: true, data: user } - user is directly in response.data
        const userData = response.data;
        if (!userData.userType) {
          userData.userType = 'parent'; // Default to parent for new registrations
        }
        
        // Update local user state and wait for it to complete
        updateUser(userData);
        
        // Debug: Check if JWT token exists
        const token = localStorage.getItem('authToken');
        console.log('JWT Token exists:', !!token);
        console.log('Updated user:', userData);
        
        // Set completion state
        setIsCompleted(true);
        
        // Wait a bit longer to ensure state is updated, then redirect
        setTimeout(() => {
          // Double-check userType before navigation
          const finalUserType = userData.userType || 'parent';
          console.log('Navigating to dashboard with userType:', finalUserType);
          
          // Force navigation with explicit userType
          if (finalUserType === 'parent') {
            navigate('/parent');
          } else if (finalUserType === 'healthcare_provider') {
            navigate('/healthcare-provider');
          } else {
            // Fallback to parent dashboard
            console.log('Falling back to parent dashboard');
            navigate('/parent');
          }
        }, 3000); // Increased delay to ensure state update
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-moh-green/5 to-accent-blue/5 flex items-center justify-center py-20">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Completed!</h1>
            <p className="text-gray-600 mb-4">
              Your profile has been successfully updated. Redirecting to dashboard...
            </p>
            <div className="flex items-center justify-center space-x-2 text-moh-green">
              <div className="w-5 h-5 border-2 border-moh-green border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Redirecting...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-moh-green/5 to-accent-blue/5 py-20">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-moh-green rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">
              Please provide your real information to complete your {user?.userType === 'parent' ? 'parent' : 'healthcare provider'} account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  placeholder="+966500000000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  National ID *
                </label>
                <input
                  type="text"
                  value={formData.nationalId}
                  onChange={(e) => handleInputChange('nationalId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  placeholder="1234567890"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <select
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                >
                  <option value="">Select a city</option>
                  <option value="Riyadh">Riyadh</option>
                  <option value="Jeddah">Jeddah</option>
                  <option value="Dammam">Dammam</option>
                  <option value="Mecca">Mecca</option>
                  <option value="Medina">Medina</option>
                  <option value="Tabuk">Tabuk</option>
                  <option value="Abha">Abha</option>
                  <option value="Jizan">Jizan</option>
                  <option value="Najran">Najran</option>
                  <option value="Hail">Hail</option>
                  <option value="Al-Jouf">Al-Jouf</option>
                  <option value="Al-Ahsa">Al-Ahsa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  placeholder="Enter street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.address.postalCode}
                  onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  placeholder="Enter postal code"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center px-8 py-4 bg-moh-green text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Updating Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    <span>Complete Profile</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionPage;
