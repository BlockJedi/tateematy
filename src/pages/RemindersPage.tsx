import React from 'react';
import { Bell, CheckCircle, Clock, AlertCircle, Calendar, User, Shield } from 'lucide-react';

const RemindersPage: React.FC = () => {
  // Mock data for reminders
  const reminders = [
    {
      id: 'R001',
      childName: 'Ahmed Al-Rashid',
      childId: 'CH001',
      vaccine: 'IPV',
      dueDate: '2024-02-15',
      status: 'upcoming',
      daysUntil: 5,
      description: 'Fourth dose of IPV vaccine'
    },
    {
      id: 'R002',
      childName: 'Fatima Al-Rashid',
      childId: 'CH002',
      vaccine: 'PCV13',
      dueDate: '2024-01-30',
      status: 'overdue',
      daysUntil: -3,
      description: 'Third dose of PCV13 vaccine'
    },
    {
      id: 'R003',
      childName: 'Ahmed Al-Rashid',
      childId: 'CH001',
      vaccine: 'MMR',
      dueDate: '2024-03-01',
      status: 'upcoming',
      daysUntil: 19,
      description: 'Second dose of MMR vaccine'
    },
    {
      id: 'R004',
      childName: 'Fatima Al-Rashid',
      childId: 'CH002',
      vaccine: 'Rotavirus',
      dueDate: '2024-02-10',
      status: 'upcoming',
      daysUntil: 0,
      description: 'Second dose of Rotavirus vaccine'
    },
    {
      id: 'R005',
      childName: 'Ahmed Al-Rashid',
      childId: 'CH001',
      vaccine: 'Varicella',
      dueDate: '2024-01-25',
      status: 'completed',
      daysUntil: 0,
      description: 'First dose of Varicella vaccine'
    }
  ];

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

  const getDaysText = (daysUntil: number) => {
    if (daysUntil === 0) return 'Due today';
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 1) return 'Due tomorrow';
    return `Due in ${daysUntil} days`;
  };

  const getPriorityColor = (status: string, daysUntil: number) => {
    if (status === 'completed') return 'border-green-200 bg-green-50';
    if (status === 'overdue') return 'border-red-200 bg-red-50';
    if (daysUntil <= 3) return 'border-orange-200 bg-orange-50';
    if (daysUntil <= 7) return 'border-yellow-200 bg-yellow-50';
    return 'border-blue-200 bg-blue-50';
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-3 bg-moh-green text-white px-6 py-3 rounded-full mb-6">
            <Bell className="w-5 h-5" />
            <span className="font-medium">Vaccination Reminders</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Vaccination Reminders
            <span className="block text-2xl md:text-3xl font-tajawal mt-2 text-moh-green">تذكيرات التطعيم</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated on your children's vaccination schedule and never miss an important immunization
          </p>
        </div>

        {/* SMS Reminder Message */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200 mb-12">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">SMS Reminder Sent</h3>
              <p className="text-green-700">
                SMS reminder has been sent to your registered mobile number (+966 50 123 4567)
              </p>
            </div>
          </div>
        </div>

        {/* Reminders List */}
        <div className="space-y-6">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`bg-white rounded-2xl shadow-lg border-2 p-6 transition-all duration-200 hover:shadow-xl ${getPriorityColor(reminder.status, reminder.daysUntil)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-moh-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-moh-green" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{reminder.childName}</h3>
                      <span className="text-sm text-gray-500">ID: {reminder.childId}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-accent-blue" />
                        <span className="font-medium text-gray-900">{reminder.vaccine}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-600">{reminder.description}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Due: {reminder.dueDate}</span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reminder.status)}`}>
                          {getStatusIcon(reminder.status)}
                          <span className="ml-1 capitalize">{reminder.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    reminder.status === 'overdue' ? 'text-red-600' :
                    reminder.daysUntil <= 3 ? 'text-orange-600' :
                    reminder.daysUntil <= 7 ? 'text-yellow-600' : 'text-blue-600'
                  }`}>
                    {getDaysText(reminder.daysUntil)}
                  </div>
                  {reminder.status === 'overdue' && (
                    <p className="text-sm text-red-600 font-medium mt-1">Action Required</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-3">
                {reminder.status === 'completed' ? (
                  <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>View Certificate</span>
                  </button>
                ) : (
                  <>
                    <button className="bg-moh-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Schedule Appointment</span>
                    </button>
                    <button className="bg-accent-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center space-x-2">
                      <Bell className="w-4 h-4" />
                      <span>Set Reminder</span>
                    </button>
                  </>
                )}
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  More Info
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Statistics Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {reminders.filter(r => r.status === 'overdue').length}
            </p>
            <p className="text-sm text-gray-600">Overdue</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {reminders.filter(r => r.status === 'upcoming' && r.daysUntil <= 3).length}
            </p>
            <p className="text-sm text-gray-600">Due This Week</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {reminders.filter(r => r.status === 'upcoming' && r.daysUntil > 3).length}
            </p>
            <p className="text-sm text-gray-600">Upcoming</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {reminders.filter(r => r.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-16 bg-gradient-to-r from-moh-green to-accent-blue rounded-2xl p-8 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
            <p className="text-lg text-green-100 mb-6 max-w-2xl mx-auto">
              If you have questions about vaccination schedules or need to reschedule appointments, 
              our healthcare team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-moh-green font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                Contact Healthcare Provider
              </button>
              <button className="border-2 border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white hover:text-moh-green transition-colors">
                View Full Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemindersPage;
