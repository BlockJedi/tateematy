import React, { useState, useEffect } from 'react';
import { Edit, Trash2, UserPlus, Building, Stethoscope, Phone, Mail, MapPin } from 'lucide-react';
import { doctorAPI } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

interface Doctor {
  _id: string;
  fullName: string;
  email: string;
  mobile: string;
  walletAddress: string;
  nationalId: string;
  healthcareProvider: {
    specialization: string;
    licenseNumber: string;
    isVerified?: boolean;
    hospital: {
      name: string;
      address: string;
      city: string;
    };
  };
  createdAt: string;
}

interface DoctorFormData {
  fullName: string;
  email: string;
  mobile: string;
  walletAddress: string;
  nationalId: string;
  healthcareProvider: {
    specialization: string;
    licenseNumber: string;
    isVerified?: boolean;
    hospital: {
      name: string;
      address: string;
      city: string;
    };
  };
}

const DoctorManagement: React.FC = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState<DoctorFormData>({
    fullName: '',
    email: '',
    mobile: '',
    walletAddress: '',
    nationalId: '',
    healthcareProvider: {
      specialization: '',
      licenseNumber: '',
      hospital: {
        name: '',
        address: '',
        city: ''
      }
    }
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorAPI.getAll();
      console.log('Doctor API Response:', response);
      console.log('Response data:', response.data);
      // The API returns { doctors: [...], pagination: {...} }
      setDoctors(response.data.doctors || []);
    } catch (err: any) {
      console.error('Error fetching doctors:', err);
      setError(err.message || 'Failed to fetch doctors');
      setDoctors([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Clear any previous errors and success messages
      setError(null);
      setSuccessMessage(null);
      
      if (editingDoctor) {
        await doctorAPI.update(editingDoctor._id, formData);
        setSuccessMessage('Doctor updated successfully!');
        setEditingDoctor(null);
      } else {
        await doctorAPI.create(formData);
        setSuccessMessage('Doctor created successfully!');
      }
      
      setShowForm(false);
      resetForm();
      fetchDoctors();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save doctor');
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      fullName: doctor.fullName,
      email: doctor.email,
      mobile: doctor.mobile,
      walletAddress: doctor.walletAddress || '',
      nationalId: doctor.nationalId || '',
      healthcareProvider: { ...doctor.healthcareProvider }
    });
    setShowForm(true);
  };

  const handleDelete = async (doctorId: string) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await doctorAPI.delete(doctorId);
        fetchDoctors();
      } catch (err: any) {
        setError(err.message || 'Failed to delete doctor');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      mobile: '',
      walletAddress: '',
      nationalId: '',
      healthcareProvider: {
        specialization: '',
        licenseNumber: '',
        hospital: {
          name: '',
          address: '',
          city: ''
        }
      }
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingDoctor(null);
    resetForm();
    setError(null); // Clear any errors when canceling
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moh-green"></div>
        <span className="ml-2 text-gray-600">Loading doctors...</span>
      </div>
    );
  }

  // Check if user is admin
  if (!user || user.userType !== 'admin') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You need admin privileges to access this section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Doctor Management</h2>
            <p className="text-gray-600 mt-2">Manage healthcare providers and medical staff in the system</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-moh-green text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <UserPlus className="w-5 h-5" />
            <span className="font-semibold">Add New Doctor</span>
          </button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total</p>
                <p className="text-2xl font-bold">
                  {Array.isArray(doctors) ? doctors.length : 0}
                </p>
              </div>
              <Stethoscope className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active</p>
                <p className="text-2xl font-bold">
                  {Array.isArray(doctors) ? doctors.filter(d => d.healthcareProvider?.isVerified).length : 0}
                </p>
              </div>
              <Building className="w-8 h-8 text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Specializations</p>
                <p className="text-2xl font-bold">
                  {Array.isArray(doctors) ? new Set(doctors.map(d => d.healthcareProvider?.specialization)).size : 0}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Hospitals</p>
                <p className="text-2xl font-bold">
                  {Array.isArray(doctors) ? new Set(doctors.map(d => d.healthcareProvider?.hospital?.name)).size : 0}
                </p>
              </div>
              <Building className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-5 h-5 text-red-500 mr-2">⚠️</div>
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Display */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-5 h-5 text-green-500 mr-2">✅</div>
            <span className="text-green-700">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Doctor Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile *
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Identity Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Identity Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wallet Address *
                  </label>
                  <input
                    type="text"
                    value={formData.walletAddress}
                    onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    National ID *
                  </label>
                  <input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    placeholder="1234567890"
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    value={formData.healthcareProvider.specialization}
                    onChange={(e) => setFormData({
                      ...formData,
                      healthcareProvider: {
                        ...formData.healthcareProvider,
                        specialization: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number *
                  </label>
                  <input
                    type="text"
                    value={formData.healthcareProvider.licenseNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      healthcareProvider: {
                        ...formData.healthcareProvider,
                        licenseNumber: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Hospital Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Hospital Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hospital Name *
                  </label>
                  <input
                    type="text"
                    value={formData.healthcareProvider.hospital.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      healthcareProvider: {
                        ...formData.healthcareProvider,
                        hospital: {
                          ...formData.healthcareProvider.hospital,
                          name: e.target.value
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.healthcareProvider.hospital.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      healthcareProvider: {
                        ...formData.healthcareProvider,
                        hospital: {
                          ...formData.healthcareProvider.hospital,
                          address: e.target.value
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.healthcareProvider.hospital.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      healthcareProvider: {
                        ...formData.healthcareProvider,
                        hospital: {
                          ...formData.healthcareProvider.hospital,
                          city: e.target.value
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-moh-green text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doctors List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Healthcare Providers</h3>
        </div>
        
        {!Array.isArray(doctors) || doctors.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No doctors found. Add your first healthcare provider above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {doctors.map((doctor) => (
              <div key={doctor._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-moh-green rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {doctor.fullName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{doctor.fullName}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center">
                            <Stethoscope className="w-4 h-4 mr-1" />
                            {doctor.healthcareProvider.specialization}
                          </span>
                          <span className="flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {doctor.healthcareProvider.hospital.name}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {doctor.healthcareProvider.hospital.city}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {doctor.email}
                          </span>
                          <span className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {doctor.mobile}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(doctor)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit doctor"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doctor._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete doctor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorManagement;
