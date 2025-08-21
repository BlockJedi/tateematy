import React from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Shield } from 'lucide-react';

const VaccinationSchedulePage: React.FC = () => {
  // Saudi National Immunization Schedule Data
  const vaccinationSchedule = [
    {
      visitAge: 'At Birth',
      vaccines: ['BCG', 'Hepatitis B'],
      description: 'First dose of Hepatitis B vaccine and BCG for tuberculosis protection'
    },
    {
      visitAge: '2 Months',
      vaccines: ['DTaP', 'IPV', 'Hib', 'Hepatitis B', 'PCV13', 'Rotavirus'],
      description: 'First dose of multiple vaccines including DTaP, IPV, and Hib'
    },
    {
      visitAge: '4 Months',
      vaccines: ['DTaP', 'IPV', 'Hib', 'Hepatitis B', 'PCV13', 'Rotavirus'],
      description: 'Second dose of vaccines given at 2 months'
    },
    {
      visitAge: '6 Months',
      vaccines: ['DTaP', 'IPV', 'Hib', 'Hepatitis B', 'PCV13', 'Rotavirus', 'Influenza'],
      description: 'Third dose of most vaccines plus first influenza vaccine'
    },
    {
      visitAge: '9 Months',
      vaccines: ['Meningococcal ACWY'],
      description: 'First dose of meningococcal vaccine'
    },
    {
      visitAge: '12 Months',
      vaccines: ['MMR', 'Varicella', 'Hepatitis A', 'PCV13'],
      description: 'First dose of MMR, Varicella, and Hepatitis A vaccines'
    },
    {
      visitAge: '15 Months',
      vaccines: ['DTaP', 'Hib', 'PCV13'],
      description: 'Fourth dose of DTaP, Hib, and PCV13'
    },
    {
      visitAge: '18 Months',
      vaccines: ['Hepatitis A'],
      description: 'Second dose of Hepatitis A vaccine'
    },
    {
      visitAge: '2 Years',
      vaccines: ['DTaP', 'IPV', 'MMR', 'Varicella'],
      description: 'Fifth dose of DTaP and second dose of MMR and Varicella'
    },
    {
      visitAge: '4-6 Years',
      vaccines: ['DTaP', 'IPV', 'MMR', 'Varicella'],
      description: 'Sixth dose of DTaP and third dose of MMR and Varicella'
    },
    {
      visitAge: '11-12 Years',
      vaccines: ['Tdap', 'Meningococcal ACWY', 'HPV'],
      description: 'Tdap booster, second meningococcal dose, and HPV vaccine'
    },
    {
      visitAge: '16 Years',
      vaccines: ['Meningococcal ACWY', 'Meningococcal B'],
      description: 'Third meningococcal ACWY dose and first meningococcal B dose'
    }
  ];

  const getVaccineBadgeColor = (vaccine: string) => {
    const colors: { [key: string]: string } = {
      'BCG': 'bg-blue-100 text-blue-800',
      'Hepatitis B': 'bg-green-100 text-green-800',
      'DTaP': 'bg-purple-100 text-purple-800',
      'IPV': 'bg-indigo-100 text-indigo-800',
      'Hib': 'bg-pink-100 text-pink-800',
      'PCV13': 'bg-yellow-100 text-yellow-800',
      'Rotavirus': 'bg-red-100 text-red-800',
      'Influenza': 'bg-orange-100 text-orange-800',
      'Meningococcal ACWY': 'bg-teal-100 text-teal-800',
      'MMR': 'bg-cyan-100 text-cyan-800',
      'Varicella': 'bg-emerald-100 text-emerald-800',
      'Hepatitis A': 'bg-lime-100 text-lime-800',
      'Tdap': 'bg-violet-100 text-violet-800',
      'HPV': 'bg-rose-100 text-rose-800',
      'Meningococcal B': 'bg-slate-100 text-slate-800'
    };
    return colors[vaccine] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-3 bg-moh-green text-white px-6 py-3 rounded-full mb-6">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Saudi National Immunization Schedule</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Vaccination Schedule
            <span className="block text-2xl md:text-3xl font-tajawal mt-2 text-moh-green">جدول التطعيم</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive immunization schedule for children from birth to 16 years, 
            following the official Saudi Ministry of Health guidelines
          </p>
        </div>

        {/* Schedule Table */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-moh-green to-accent-blue text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Visit Age
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Vaccines
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vaccinationSchedule.map((visit, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-moh-green/10 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-moh-green" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{visit.visitAge}</div>
                          <div className="text-xs text-gray-500">Visit {index + 1}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {visit.vaccines.map((vaccine, vaccineIndex) => (
                          <span
                            key={vaccineIndex}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getVaccineBadgeColor(vaccine)}`}
                          >
                            {vaccine}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs">{visit.description}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {index < 3 ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">Completed</span>
                          </div>
                        ) : index < 6 ? (
                          <div className="flex items-center text-blue-600">
                            <Clock className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">Upcoming</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">Future</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 border border-green-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-moh-green mr-3" />
              Important Notes
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-moh-green rounded-full mt-2 flex-shrink-0"></span>
                <span>All vaccines are provided free of charge at government health centers</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-moh-green rounded-full mt-2 flex-shrink-0"></span>
                <span>Keep vaccination records safe and bring them to every visit</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-moh-green rounded-full mt-2 flex-shrink-0"></span>
                <span>Some vaccines may have mild side effects - consult your healthcare provider</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-moh-green rounded-full mt-2 flex-shrink-0"></span>
                <span>Schedule may vary based on individual health conditions</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="w-6 h-6 text-accent-blue mr-3" />
              Digital Tracking
            </h3>
            <p className="text-gray-700 mb-4">
              Tateematy automatically tracks your child's vaccination progress and sends 
              timely reminders for upcoming appointments.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-moh-green rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-700">Real-time progress tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-700">Automated SMS reminders</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-700">Blockchain-verified records</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-moh-green to-accent-blue rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Start Tracking?
            </h3>
            <p className="text-lg text-green-100 mb-6 max-w-2xl mx-auto">
              Create your account and start managing your child's vaccination schedule 
              with our secure blockchain-based system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center justify-center px-8 py-3 bg-white text-moh-green font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                <Calendar className="w-5 h-5 mr-2" />
                Start Tracking
              </button>
              <button className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-moh-green transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaccinationSchedulePage;
