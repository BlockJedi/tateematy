import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, GraduationCap, Loader } from 'lucide-react';
import { vaccinationAPI } from '../lib/api';

interface VaccinationProgressProps {
  childId: string;
  childName: string;
  dateOfBirth: Date;
}

interface Vaccine {
  vaccineName: string;
  doseNumber: number;
  totalDoses: number;
  description?: string;
}

interface AgeGroup {
  vaccines: Vaccine[];
  completed: string[];
  pending: Vaccine[];
  status: 'pending' | 'partial' | 'completed';
}

interface ProgressData {
  childId: string;
  childName: string;
  dateOfBirth: Date;
  ageInMonths: number;
  progress: Record<string, AgeGroup>;
  overallStatus: string;
  schoolReady: boolean;
}

const VaccinationProgress: React.FC<VaccinationProgressProps> = ({ 
  childId, 
  childName, 
  dateOfBirth 
}) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgress();
  }, [childId]);

  const fetchProgress = async () => {
    try {
      console.log('🔄 Fetching vaccination progress for child:', childId);
      setLoading(true);
      setError(null);
      const response = await vaccinationAPI.getProgress(childId);
      console.log('✅ Vaccination progress response:', response);
      setProgressData(response.data);
    } catch (err: any) {
      console.error('❌ Error fetching vaccination progress:', err);
      setError(err.message || 'Failed to fetch vaccination progress');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'partial':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      case 'pending':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <XCircle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'partial':
        return 'bg-yellow-50 border-yellow-200';
      case 'pending':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'partial':
        return 'Partially Complete';
      case 'pending':
        return 'Not Started';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-moh-green" />
        <span className="ml-2 text-gray-600">Loading vaccination progress...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
        <button
          onClick={fetchProgress}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!progressData) {
    return null;
  }

  const ageGroups = Object.keys(progressData.progress).sort((a, b) => {
    const order = ['At Birth', '2 Months', '4 Months', '6 Months', '9 Months', '12 Months', '18 Months', '24 Months', '4-6 Years', '11 Years', '12 Years', '18 Years'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{childName}'s Vaccination Progress</h2>
            <p className="text-gray-600 mt-1">
              Age: {progressData.ageInMonths} months • Overall: {progressData.overallStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
          <div className="text-right">
            {progressData.schoolReady && (
              <div className="flex items-center bg-green-100 text-green-800 px-3 py-2 rounded-full">
                <GraduationCap className="w-5 h-5 mr-2" />
                <span className="font-semibold">Ready for School</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="space-y-4">
        {ageGroups.map((ageKey, index) => {
          const ageGroup = progressData.progress[ageKey];
          const isLast = index === ageGroups.length - 1;
          
          return (
            <div key={ageKey} className="relative">
              {/* Timeline Line */}
              {!isLast && (
                <div className="absolute left-8 top-12 w-0.5 h-16 bg-gray-200" />
              )}
              
              {/* Age Group Card */}
              <div className={`relative bg-white rounded-lg shadow-sm border-2 ${getStatusColor(ageGroup.status)} p-6 ml-16`}>
                {/* Status Icon */}
                <div className="absolute -left-12 top-6 bg-white rounded-full p-1 border-2 border-gray-200">
                  {getStatusIcon(ageGroup.status)}
                </div>
                
                {/* Age Group Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{ageKey}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    ageGroup.status === 'completed' ? 'bg-green-100 text-green-800' :
                    ageGroup.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getStatusText(ageGroup.status)}
                  </span>
                </div>
                
                {/* Vaccines List */}
                <div className="space-y-3">
                  {ageGroup.vaccines.map((vaccine, vaccineIndex) => {
                    const isCompleted = ageGroup.completed.some(completed => 
                      completed.startsWith(vaccine.vaccineName)
                    );
                    
                    return (
                      <div key={`${vaccine.vaccineName}-${vaccine.doseNumber}`} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          <span className={`font-medium ${
                            isCompleted ? 'text-green-700' : 'text-gray-700'
                          }`}>
                            {vaccine.vaccineName} - Dose {vaccine.doseNumber}/{vaccine.totalDoses}
                          </span>
                        </div>
                        <span className={`text-sm ${
                          isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {isCompleted ? '✓ Completed' : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      {ageGroup.completed.length} of {ageGroup.vaccines.length} vaccines completed
                    </span>
                    <span className="font-medium">
                      {Math.round((ageGroup.completed.length / ageGroup.vaccines.length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={fetchProgress}
            className="px-4 py-2 bg-moh-green text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Refresh Progress
          </button>
          
          {progressData.schoolReady && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Generate School Certificate
            </button>
          )}
          
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            View Detailed History
          </button>
        </div>
      </div>
    </div>
  );
};

export default VaccinationProgress;
