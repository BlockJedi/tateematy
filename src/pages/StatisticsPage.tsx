import React from 'react';
import { BarChart3, Users, Shield, FileText, TrendingUp, Award } from 'lucide-react';

const StatisticsPage: React.FC = () => {
  // Mock statistics data
  const stats = {
    totalChildren: 15420,
    totalVaccinations: 89234,
    certificatesIssued: 45678,
    activeHealthcareProviders: 234,
    activeParents: 12345,
    vaccinationCompletionRate: 94.2
  };

  const monthlyData = [
    { month: 'Jan', vaccinations: 1250, certificates: 980 },
    { month: 'Feb', vaccinations: 1380, certificates: 1120 },
    { month: 'Mar', vaccinations: 1420, certificates: 1180 },
    { month: 'Apr', vaccinations: 1350, certificates: 1050 },
    { month: 'May', vaccinations: 1480, certificates: 1220 },
    { month: 'Jun', vaccinations: 1520, certificates: 1280 }
  ];

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-3 bg-moh-green text-white px-6 py-3 rounded-full mb-6">
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">System Statistics</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            System Statistics
            <span className="block text-2xl md:text-3xl font-tajawal mt-2 text-moh-green">إحصائيات النظام</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive overview of the Tateematy vaccination management system performance and usage
          </p>
        </div>

        {/* Key Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalChildren.toLocaleString()}</h3>
            <p className="text-lg text-gray-600">Total Children</p>
            <div className="mt-4 flex items-center justify-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+12% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalVaccinations.toLocaleString()}</h3>
            <p className="text-lg text-gray-600">Total Vaccinations</p>
            <div className="mt-4 flex items-center justify-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+8% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.certificatesIssued.toLocaleString()}</h3>
            <p className="text-lg text-gray-600">Certificates Issued</p>
            <div className="mt-4 flex items-center justify-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+15% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.activeHealthcareProviders}</h3>
            <p className="text-lg text-gray-600">Healthcare Providers</p>
            <div className="mt-4 flex items-center justify-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+3% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.activeParents.toLocaleString()}</h3>
            <p className="text-lg text-gray-600">Active Parents</p>
            <div className="mt-4 flex items-center justify-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+18% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.vaccinationCompletionRate}%</h3>
            <p className="text-lg text-gray-600">Completion Rate</p>
            <div className="mt-4 flex items-center justify-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+2% from last month</span>
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Monthly Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vaccinations Administered</h3>
              <div className="space-y-3">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-600">{data.month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-moh-green h-2 rounded-full" 
                          style={{ width: `${(data.vaccinations / 1600) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{data.vaccinations}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificates Issued</h3>
              <div className="space-y-3">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-600">{data.month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-accent-blue h-2 rounded-full" 
                          style={{ width: `${(data.certificates / 1300) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{data.certificates}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Uptime</span>
                <span className="font-semibold text-green-600">99.9%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Response Time</span>
                <span className="font-semibold text-green-600">120ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Data Accuracy</span>
                <span className="font-semibold text-green-600">100%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Blockchain Sync</span>
                <span className="font-semibold text-green-600">Real-time</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Riyadh</span>
                <span className="font-semibold text-gray-900">45%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Jeddah</span>
                <span className="font-semibold text-gray-900">28%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Dammam</span>
                <span className="font-semibold text-gray-900">15%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Other Cities</span>
                <span className="font-semibold text-gray-900">12%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vision 2030 Impact */}
        <div className="bg-gradient-to-r from-moh-green to-accent-blue rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Supporting Vision 2030 Goals</h3>
          <p className="text-lg text-green-100 mb-6 max-w-3xl mx-auto">
            Tateematy contributes to Saudi Arabia's digital transformation by providing 
            secure, efficient, and transparent healthcare services through blockchain technology.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-2">Digital Health</h4>
              <p className="text-green-100">Modernizing healthcare delivery</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Data Security</h4>
              <p className="text-green-100">Blockchain-based data protection</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Efficiency</h4>
              <p className="text-green-100">Streamlined vaccination management</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
