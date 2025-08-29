import React, { useState, useEffect } from 'react';
import { Syringe, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import { vaccinationAPI } from '../lib/api';

interface Child {
  _id: string;
  fullName: string;
  dateOfBirth: string;
  childId?: string;
}

interface Vaccine {
  vaccineName: string;
  doseNumber: number;
  totalDoses: number;
  scheduledDate?: string;
  completedDate?: string;
}

interface AgeGroupData {
  status: 'completed' | 'pending' | 'overdue';
  pending: Vaccine[];
  completed: Vaccine[];
}

interface VaccinationProgress {
  [ageGroup: string]: AgeGroupData;
}

interface SelectedChildProgressProps {
  child: Child | null;
}

const SelectedChildProgress: React.FC<SelectedChildProgressProps> = ({ child }) => {
  const [progress, setProgress] = useState<VaccinationProgress>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (child) {
      fetchChildProgress();
    }
  }, [child]);

  const fetchChildProgress = async () => {
    if (!child) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await vaccinationAPI.getProgress(child._id);
      if (response.success) {
        setProgress(response.data.progress || {});
      } else {
        setError(response.message || 'Failed to fetch progress');
      }
    } catch (err: any) {
      console.error('Error fetching child progress:', err);
      setError(err.message || 'Failed to fetch vaccination progress');
    } finally {
      setLoading(false);
    }
  };

  if (!child) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Syringe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Select a child to view their vaccination progress</p>
      </div>
    );
  }

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                        (today.getMonth() - birthDate.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      if (months === 0) {
        return `${years} year${years !== 1 ? 's' : ''}`;
      } else {
        return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Loader className="w-8 h-8 animate-spin text-moh-green mx-auto mb-4" />
        <p className="text-gray-600">Loading vaccination progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchChildProgress}
          className="px-4 py-2 bg-moh-green text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Child Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{child.fullName}</h3>
          <p className="text-gray-600">
            Age: {calculateAge(child.dateOfBirth)} • 
            Born: {new Date(child.dateOfBirth).toLocaleDateString()}
            {child.childId && (
              <span className="ml-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {child.childId}
              </span>
            )}
          </p>
        </div>
        <div className="w-12 h-12 bg-moh-green/10 rounded-full flex items-center justify-center">
          <Syringe className="w-6 h-6 text-moh-green" />
        </div>
      </div>

      {/* Vaccination Progress */}
      {Object.keys(progress).length === 0 ? (
        <div className="text-center py-8">
          <Syringe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No vaccination progress data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(progress).map(([ageGroup, ageData]) => (
            <div key={ageGroup} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                {getStatusIcon(ageData.status)}
                <span className="ml-2">{ageGroup}</span>
                <span className={`ml-auto text-xs px-2 py-1 rounded-full border ${getStatusColor(ageData.status)}`}>
                  {ageData.status.charAt(0).toUpperCase() + ageData.status.slice(1)}
                </span>
              </h4>
              
              {/* Pending Vaccines */}
              {ageData.pending && ageData.pending.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Pending Vaccines
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ageData.pending.map((vaccine: Vaccine, index: number) => (
                      <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{vaccine.vaccineName}</span>
                          <Clock className="w-4 h-4 text-yellow-600" />
                        </div>
                        <p className="text-xs text-yellow-700">
                          Dose {vaccine.doseNumber} of {vaccine.totalDoses}
                        </p>
                        {vaccine.scheduledDate && (
                          <p className="text-xs text-yellow-600">
                            Due: {new Date(vaccine.scheduledDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Completed Vaccines */}
              {ageData.completed && ageData.completed.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completed Vaccines
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ageData.completed.map((vaccine: Vaccine, index: number) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{vaccine.vaccineName}</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-xs text-green-700">
                          Dose {vaccine.doseNumber} of {vaccine.totalDoses}
                        </p>
                        {vaccine.completedDate && (
                          <p className="text-xs text-green-600">
                            Completed: {new Date(vaccine.completedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* No vaccines message */}
              {(!ageData.pending || ageData.pending.length === 0) && 
               (!ageData.completed || ageData.completed.length === 0) && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No vaccines scheduled for this age group
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectedChildProgress;
