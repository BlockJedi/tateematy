import React, { useState } from 'react';
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
  FileText,
  X
} from 'lucide-react';

const ParentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChild, setNewChild] = useState({
    childId: '',
    name: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  // Mock data
  const profile = {
    name: 'Abdullah Al-Rashid',
    id: 'P001',
    mobile: '+966 50 123 4567',
    walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  };

  const children = [
    {
      id: 'CH001',
      name: 'Ahmed Al-Rashid',
      age: '2 years',
      vaccinationsCompleted: 8,
      vaccinationsTotal: 12,
      nextDue: '2024-02-15',
      status: 'upcoming'
    },
    {
      id: 'CH002',
      name: 'Fatima Al-Rashid',
      age: '6 months',
      vaccinationsCompleted: 4,
      vaccinationsTotal: 6,
      nextDue: '2024-01-30',
      status: 'overdue'
    }
  ];

  const vaccinationRecords = [
    {
      id: 'V001',
      childName: 'Ahmed Al-Rashid',
      vaccine: 'DTaP',
      date: '2024-01-15',
      status: 'completed',
      certificate: 'DTaP_2024_01_15.pdf'
    },
    {
      id: 'V002',
      childName: 'Ahmed Al-Rashid',
      vaccine: 'MMR',
      date: '2024-01-20',
      status: 'completed',
      certificate: 'MMR_2024_01_20.pdf'
    },
    {
      id: 'V003',
      childName: 'Fatima Al-Rashid',
      vaccine: 'Hepatitis B',
      date: '2024-01-25',
      status: 'completed',
      certificate: 'HepB_2024_01_25.pdf'
    }
  ];

  const reminders = [
    {
      id: 'R001',
      childName: 'Ahmed Al-Rashid',
      vaccine: 'IPV',
      dueDate: '2024-02-15',
      status: 'upcoming'
    },
    {
      id: 'R002',
      childName: 'Fatima Al-Rashid',
      vaccine: 'PCV13',
      dueDate: '2024-01-30',
      status: 'overdue'
    }
  ];

  const handleAddChild = () => {
    // Here you would typically send the data to your backend
    console.log('Adding new child:', newChild);
    
    // For demo purposes, we'll just close the modal
    setShowAddChildModal(false);
    setNewChild({
      childId: '',
      name: '',
      dateOfBirth: '',
      gender: '',
      bloodType: '',
      emergencyContact: '',
      emergencyPhone: ''
    });
    
    // You could also add the child to the children array here
    // and update the state accordingly
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
                <p className="text-gray-600">Parent ID: {profile.id}</p>
                <p className="text-gray-600">Mobile: {profile.mobile}</p>
              </div>
            </div>
            <div className="text-right">
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
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Children</p>
                    <p className="text-2xl font-bold text-gray-900">{children.length}</p>
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
                      {vaccinationRecords.length}
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
                    <p className="text-sm text-gray-600">Token Balance</p>
                    <p className="text-2xl font-bold text-gray-900">250 VT</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Children Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Children Summary</h3>
              <div className="space-y-4">
                {children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-moh-green/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-moh-green" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{child.name}</h4>
                        <p className="text-sm text-gray-600">{child.age} • {child.vaccinationsCompleted}/{child.vaccinationsTotal} completed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Next due: {child.nextDue}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(child.status)}`}>
                        {getStatusIcon(child.status)}
                        <span className="ml-1 capitalize">{child.status}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">DTaP vaccination completed for Ahmed</span>
                  <span className="text-gray-400">2 days ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">MMR vaccination scheduled for Fatima</span>
                  <span className="text-gray-400">1 week ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">Earned 50 VT for completing vaccination schedule</span>
                  <span className="text-gray-400">1 week ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Children Tab */}
        {activeTab === 'children' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Manage Children</h3>
              <button 
                onClick={() => setShowAddChildModal(true)}
                className="bg-moh-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Child</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {children.map((child) => (
                <div key={child.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-moh-green/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-moh-green" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{child.name}</h4>
                        <p className="text-sm text-gray-600">ID: {child.id}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        // Here you would populate the form with existing child data
                        console.log('Edit child:', child);
                        // For now, just show an alert
                        alert(`Edit functionality for ${child.name} - This would open an edit form`);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium">{child.age}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Vaccinations:</span>
                      <span className="font-medium">{child.vaccinationsCompleted}/{child.vaccinationsTotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Next Due:</span>
                      <span className="font-medium">{child.nextDue}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                    <button className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm hover:bg-green-200 transition-colors flex items-center justify-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>Records</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vaccination Records Tab */}
        {activeTab === 'records' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Vaccination Records</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Child
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vaccine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
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
                  {vaccinationRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.childName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {record.vaccine}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          <span className="ml-1 capitalize">{record.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-moh-green hover:text-green-600 mr-3">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="text-accent-blue hover:text-blue-600">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reminders Tab */}
        {activeTab === 'reminders' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upcoming Vaccinations</h3>
              <p className="text-sm text-gray-600">
                SMS reminder sent to your registered mobile number
              </p>
            </div>

            <div className="space-y-4">
              {reminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-moh-green/10 rounded-full flex items-center justify-center">
                      <Bell className="w-5 h-5 text-moh-green" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{reminder.childName}</h4>
                      <p className="text-sm text-gray-600">{reminder.vaccine} vaccination due</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Due: {reminder.dueDate}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reminder.status)}`}>
                      {getStatusIcon(reminder.status)}
                      <span className="ml-1 capitalize">{reminder.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blockchain Transaction Message */}
        <div className="mt-8 bg-gradient-to-r from-moh-green to-accent-blue rounded-2xl p-6 text-white">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Blockchain Transaction</h3>
          </div>
          <p className="text-green-100">
            All vaccination records are securely stored on the Ethereum blockchain. 
            Your data is immutable and verifiable through the blockchain explorer.
          </p>
        </div>

        {/* Add Child Modal */}
        {showAddChildModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Add New Child</h3>
                <button
                  onClick={() => setShowAddChildModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Child ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child ID *
                  </label>
                  <input
                    type="text"
                    value={newChild.childId}
                    onChange={(e) => setNewChild({...newChild, childId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    placeholder="Enter child's ID number"
                  />
                </div>

                {/* Child Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child's Full Name *
                  </label>
                  <input
                    type="text"
                    value={newChild.name}
                    onChange={(e) => setNewChild({...newChild, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    placeholder="Enter child's full name"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={newChild.dateOfBirth}
                    onChange={(e) => setNewChild({...newChild, dateOfBirth: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
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

                {/* Blood Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Type
                  </label>
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

                {/* Emergency Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={newChild.emergencyContact}
                    onChange={(e) => setNewChild({...newChild, emergencyContact: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    placeholder="Emergency contact person name"
                  />
                </div>

                {/* Emergency Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newChild.emergencyPhone}
                    onChange={(e) => setNewChild({...newChild, emergencyPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
                    placeholder="+966 50 123 4567"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddChildModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddChild}
                  disabled={!newChild.childId || !newChild.name || !newChild.dateOfBirth || !newChild.gender}
                  className="flex-1 bg-moh-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Child
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
