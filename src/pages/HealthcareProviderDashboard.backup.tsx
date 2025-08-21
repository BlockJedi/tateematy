import React, { useState } from 'react';
import { 
  Shield, 
  Plus, 
  List, 
  FileText, 
  Search, 
  User, 
  Syringe,
  Download,
  Eye,
  QrCode,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

const HealthcareProviderDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('add-vaccination');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for vaccinations
  const vaccinations = [
    {
      id: 'V001',
      childName: 'Ahmed Al-Rashid',
      childId: 'CH001',
      vaccine: 'DTaP',
      date: '2024-01-15',
      nextDue: '2024-03-15',
      status: 'completed'
    },
    {
      id: 'V002',
      childName: 'Fatima Al-Zahra',
      childId: 'CH002',
      vaccine: 'MMR',
      date: '2024-01-20',
      nextDue: '2024-02-20',
      status: 'completed'
    },
    {
      id: 'V003',
      childName: 'Omar Al-Sayed',
      childId: 'CH003',
      vaccine: 'Hepatitis B',
      date: '2024-01-25',
      nextDue: '2024-04-25',
      status: 'completed'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
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
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-accent-blue rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Healthcare Provider</h2>
                <p className="text-sm text-gray-500">Dr. Sarah Al-Mansouri</p>
              </div>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('add-vaccination')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'add-vaccination'
                    ? 'bg-moh-green text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>Add New Vaccination</span>
              </button>

              <button
                onClick={() => setActiveTab('list-vaccinations')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'list-vaccinations'
                    ? 'bg-moh-green text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <List className="w-5 h-5" />
                <span>List Vaccinations</span>
              </button>

              <button
                onClick={() => setActiveTab('issue-certificate')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'issue-certificate'
                    ? 'bg-moh-green text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Issue Certificate</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Healthcare Provider Dashboard
            </h1>
            <p className="text-gray-600">
              Manage vaccination records and issue certificates for children
            </p>
          </div>

          {/* Add New Vaccination Record */}
          {activeTab === 'add-vaccination' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                  <Plus className="w-6 h-6 text-moh-green mr-3" />
                  Add New Vaccination Record
                </h2>
                <p className="text-gray-600">
                  Record a new vaccination for a child. This will be stored on the blockchain.
                </p>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Child Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                      placeholder="Enter child's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Child ID *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                      placeholder="Enter child's ID number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vaccine Type *
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent">
                      <option value="">Select vaccine</option>
                      <option value="BCG">BCG</option>
                      <option value="Hepatitis B">Hepatitis B</option>
                      <option value="DTaP">DTaP</option>
                      <option value="IPV">IPV</option>
                      <option value="Hib">Hib</option>
                      <option value="PCV13">PCV13</option>
                      <option value="Rotavirus">Rotavirus</option>
                      <option value="MMR">MMR</option>
                      <option value="Varicella">Varicella</option>
                      <option value="Hepatitis A">Hepatitis A</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vaccination Date *
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Next Due Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Certificate
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-moh-green transition-colors">
                      <Syringe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-moh-green to-accent-blue text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Vaccination Record</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List Vaccinations */}
          {activeTab === 'list-vaccinations' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                  <List className="w-6 h-6 text-moh-green mr-3" />
                  Vaccination Records
                </h2>
                <p className="text-gray-600">
                  View and manage all vaccination records in the system
                </p>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by child ID or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  />
                </div>
              </div>

              {/* Vaccinations Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Child Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vaccine
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Next Due
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vaccinations.map((vaccination) => (
                      <tr key={vaccination.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-moh-green/10 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-moh-green" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {vaccination.childName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {vaccination.childId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {vaccination.vaccine}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vaccination.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vaccination.nextDue}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vaccination.status)}`}>
                            {getStatusIcon(vaccination.status)}
                            <span className="ml-1 capitalize">{vaccination.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-moh-green hover:text-green-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-accent-blue hover:text-blue-600">
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Issue Certificate */}
          {activeTab === 'issue-certificate' && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                  <FileText className="w-6 h-6 text-moh-green mr-3" />
                  Issue Vaccination Certificate
                </h2>
                <p className="text-gray-600">
                  Generate and issue blockchain-verified vaccination certificates
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Certificate Generation Form */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Certificate</h3>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Child
                      </label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent">
                        <option value="">Choose a child</option>
                        <option value="CH001">Ahmed Al-Rashid (CH001)</option>
                        <option value="CH002">Fatima Al-Zahra (CH002)</option>
                        <option value="CH003">Omar Al-Sayed (CH003)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certificate Type
                      </label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent">
                        <option value="">Select certificate type</option>
                        <option value="comprehensive">Comprehensive Vaccination Record</option>
                        <option value="specific">Specific Vaccine Certificate</option>
                        <option value="schedule">Vaccination Schedule Summary</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-moh-green text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Generate Certificate</span>
                    </button>
                  </form>
                </div>

                {/* Certificate Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Actions</h3>
                  <div className="space-y-4">
                    <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                      <Eye className="w-5 h-5" />
                      <span>View on Blockchain</span>
                    </button>

                    <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                      <Download className="w-5 h-5" />
                      <span>Download PDF</span>
                    </button>

                    <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
                      <QrCode className="w-5 h-5" />
                      <span>Generate QR Code</span>
                    </button>
                  </div>

                  {/* Certificate Preview */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Certificate Preview</h4>
                    <div className="text-sm text-gray-600">
                      <p>Select a child and certificate type to preview</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthcareProviderDashboard;
