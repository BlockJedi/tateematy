import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Shield, Loader } from 'lucide-react';
import { scheduleAPI } from '../lib/api';

const VaccinationSchedulePage: React.FC = () => {
  const [vaccinationSchedule, setVaccinationSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vaccination schedule from backend
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const response = await scheduleAPI.getComplete();
        if (response.success) {
          // Transform the data to match our frontend structure
          const transformedSchedule = response.data.scheduleByAge.map((ageGroup: any) => ({
            visitAge: ageGroup.visitAge,
            vaccines: ageGroup.vaccines.map((v: any) => v.vaccineName),
            description: ageGroup.vaccines.map((v: any) => v.description).join('; '),
            ageInMonths: ageGroup.ageInMonths
          }));
          setVaccinationSchedule(transformedSchedule);
        } else {
          setError('Failed to fetch vaccination schedule');
        }
      } catch (err) {
        console.error('Error fetching vaccination schedule:', err);
        // Fallback to static data
        setVaccinationSchedule(fallbackSchedule);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  // Fallback to static data if API fails (Complete Schedule: 0-18 years)
  const fallbackSchedule = [
    {
      visitAge: 'At Birth',
      vaccines: ['Hepatitis B'],
      description: 'First dose of Hepatitis B vaccine'
    },
    {
      visitAge: '2 Months',
      vaccines: ['IPV', 'DTaP', 'Hepatitis B', 'Hib', 'PCV', 'Rotavirus'],
      description: 'First dose of IPV, DTaP, Hepatitis B, Hib, PCV, and Rotavirus'
    },
    {
      visitAge: '4 Months',
      vaccines: ['IPV', 'DTaP', 'Hepatitis B', 'Hib', 'PCV', 'Rotavirus'],
      description: 'Second dose of IPV, DTaP, Hepatitis B, Hib, PCV, and Rotavirus'
    },
    {
      visitAge: '6 Months',
      vaccines: ['IPV', 'DTaP', 'Hepatitis B', 'Hib', 'PCV', 'OPV', 'Rotavirus', 'BCG'],
      description: 'Third dose of IPV, DTaP, Hepatitis B, Hib, PCV, Rotavirus, plus OPV and BCG'
    },
    {
      visitAge: '9 Months',
      vaccines: ['Measles', 'MCV4'],
      description: 'First dose of Measles and MCV4 (Meningococcal Conjugate Vaccine)'
    },
    {
      visitAge: '12 Months',
      vaccines: ['OPV', 'MMR', 'PCV', 'MCV4'],
      description: 'Second dose of OPV, first dose of MMR, third dose of PCV, and second dose of MCV4'
    },
    {
      visitAge: '18 Months',
      vaccines: ['OPV', 'DTaP', 'Hib', 'MMR', 'Varicella', 'Hepatitis A'],
      description: 'Third dose of OPV, fourth dose of DTaP, third dose of Hib, second dose of MMR, first dose of Varicella and Hepatitis A'
    },
    {
      visitAge: '24 Months',
      vaccines: ['Hepatitis A'],
      description: 'Second dose of Hepatitis A vaccine'
    },
    {
      visitAge: '4-6 Years',
      vaccines: ['OPV', 'DTaP', 'MMR', 'Varicella'],
      description: 'Fourth dose of OPV, fifth dose of DTaP, second dose of MMR and Varicella'
    },
    {
      visitAge: '11 Years',
      vaccines: ['DTaP', 'HPV'],
      description: 'DTaP booster and first dose of HPV vaccine (Female only)'
    },
    {
      visitAge: '12 Years',
      vaccines: ['HPV'],
      description: 'Second dose of HPV vaccine (Female only)'
    },
    {
      visitAge: '18 Years',
      vaccines: ['MCV4'],
      description: 'MCV4 (Meningococcal Conjugate Vaccine)'
    }
  ];

  const getVaccineBadgeColor = (vaccine: string) => {
    const colors: { [key: string]: string } = {
      'Hepatitis B': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'DTaP': 'bg-violet-50 text-violet-700 border border-violet-200',
      'IPV': 'bg-blue-50 text-blue-700 border border-blue-200',
      'Hib': 'bg-pink-50 text-pink-700 border border-pink-200',
      'PCV': 'bg-amber-50 text-amber-700 border border-amber-200',
      'Rotavirus': 'bg-red-50 text-red-700 border border-red-200',
      'OPV': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      'BCG': 'bg-orange-50 text-orange-700 border border-orange-200',
      'MCV4': 'bg-teal-50 text-teal-700 border border-teal-200',
      'MMR': 'bg-cyan-50 text-cyan-700 border border-cyan-200',
      'Varicella': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'Hepatitis A': 'bg-lime-50 text-lime-700 border border-lime-200',
      'Measles': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      'HPV': 'bg-rose-50 text-rose-700 border border-rose-200'
    };
    return colors[vaccine] || 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-moh-green to-green-600 text-white px-8 py-4 rounded-full mb-8 shadow-lg">
            <Calendar className="w-6 h-6" />
            <span className="font-semibold text-lg">Saudi National Immunization Schedule</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
            Vaccination Schedule
            <span className="block text-3xl md:text-4xl font-tajawal mt-3 text-moh-green">جدول التطعيم</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Comprehensive immunization schedule for children from birth to 18 years, 
            following the official Saudi Ministry of Health guidelines
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-moh-green/10 rounded-full flex items-center justify-center">
                <Loader className="w-8 h-8 text-moh-green animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Vaccination Schedule</h3>
                <p className="text-gray-600">Please wait while we fetch the latest immunization data...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-red-900 mb-2">Error Loading Schedule</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-8 py-3 bg-moh-green text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Table */}
        {!loading && !error && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-moh-green to-accent-blue text-white px-6 py-4">
              <h2 className="text-xl font-bold">Complete Vaccination Schedule</h2>
              <p className="text-green-100 text-sm mt-1">From birth to 18 years</p>
            </div>
            
            {/* Mobile Cards View */}
            <div className="block lg:hidden">
              {vaccinationSchedule.map((visit, index) => (
                <div key={index} className="p-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                  {/* Visit Age Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-moh-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-moh-green" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{visit.visitAge}</div>
                      <div className="text-sm text-gray-500">Visit {index + 1}</div>
                    </div>
                  </div>
                  
                  {/* Vaccines */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Vaccines:</h4>
                    <div className="flex flex-wrap gap-2">
                      {visit.vaccines.map((vaccine: string, vaccineIndex: number) => (
                        <span
                          key={vaccineIndex}
                          className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${getVaccineBadgeColor(vaccine)}`}
                        >
                          {vaccine}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Description:</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{visit.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-200">
                        Visit Age
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-200">
                        Vaccines
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-200">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {vaccinationSchedule.map((visit, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-moh-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Clock className="w-6 h-6 text-moh-green" />
                            </div>
                            <div>
                              <div className="text-lg font-bold text-gray-900">{visit.visitAge}</div>
                              <div className="text-sm text-gray-500">Visit {index + 1}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-wrap gap-2 max-w-md">
                            {visit.vaccines.map((vaccine: string, vaccineIndex: number) => (
                              <span
                                key={vaccineIndex}
                                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${getVaccineBadgeColor(vaccine)}`}
                              >
                                {vaccine}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm text-gray-600 leading-relaxed max-w-sm">{visit.description}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-8 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-moh-green rounded-full flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Important Notes</h3>
            </div>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-moh-green rounded-full mt-3 flex-shrink-0"></div>
                <span className="text-base leading-relaxed">All vaccines are provided free of charge at government health centers</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-moh-green rounded-full mt-3 flex-shrink-0"></div>
                <span className="text-base leading-relaxed">Some vaccines may have mild side effects - consult your healthcare provider</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-moh-green rounded-full mt-3 flex-shrink-0"></div>
                <span className="text-base leading-relaxed">Schedule may vary based on individual health conditions</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl p-8 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-accent-blue rounded-full flex items-center justify-center mr-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Digital Tracking</h3>
            </div>
            <p className="text-gray-700 mb-6 text-base leading-relaxed">
              Tateematy automatically tracks your child's vaccination progress and sends 
              timely reminders for upcoming appointments.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-moh-green rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-base text-gray-700 font-medium">Real-time progress tracking</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-accent-blue rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-base text-gray-700 font-medium">Automated SMS reminders</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-base text-gray-700 font-medium">Blockchain-verified records</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-moh-green via-green-600 to-accent-blue rounded-3xl p-12 text-white shadow-2xl">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Start Tracking?
              </h3>
              <p className="text-xl text-green-100 mb-8 leading-relaxed">
                Create your account and start managing your child's vaccination schedule 
                with our secure blockchain-based system.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="inline-flex items-center justify-center px-10 py-4 bg-white text-moh-green font-bold rounded-xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg">
                  <Calendar className="w-6 h-6 mr-3" />
                  Start Tracking
                </button>
                <button className="inline-flex items-center justify-center px-10 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-moh-green transition-all duration-200 transform hover:scale-105">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaccinationSchedulePage;
