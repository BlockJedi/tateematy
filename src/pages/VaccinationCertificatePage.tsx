import React from 'react';
import { Download, Eye, QrCode, Shield, Calendar, User, FileText, CheckCircle } from 'lucide-react';

const VaccinationCertificatePage: React.FC = () => {
  // Mock certificate data
  const certificate = {
    certificateId: 'CERT-2024-001',
    childName: 'Ahmed Al-Rashid',
    childId: 'CH001',
    dateOfBirth: '2022-01-15',
    parentName: 'Abdullah Al-Rashid',
    issueDate: '2024-01-25',
    healthcareProvider: 'Dr. Sarah Al-Mansouri',
    facility: 'King Fahad Medical City',
    blockchainHash: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    vaccinations: [
      {
        name: 'DTaP',
        date: '2024-01-15',
        dose: '4th dose',
        batch: 'DT2024-001'
      },
      {
        name: 'IPV',
        date: '2024-01-15',
        dose: '4th dose',
        batch: 'IP2024-001'
      },
      {
        name: 'Hib',
        date: '2024-01-15',
        dose: '4th dose',
        batch: 'HB2024-001'
      },
      {
        name: 'PCV13',
        date: '2024-01-15',
        dose: '4th dose',
        batch: 'PC2024-001'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Vaccination Certificate
            <span className="block text-2xl md:text-3xl font-tajawal mt-2 text-moh-green">شهادة التطعيم</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Official vaccination certificate verified on the blockchain
          </p>
        </div>

        {/* Certificate */}
        <div className="bg-white rounded-3xl shadow-2xl border-4 border-moh-green overflow-hidden">
          {/* Certificate Header */}
          <div className="bg-gradient-to-r from-moh-green to-accent-blue text-white p-8 text-center">
            <div className="flex items-center justify-center space-x-8 mb-6">
              {/* Ministry of Health Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <span className="text-moh-green font-bold text-lg">MoH</span>
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold">Ministry of Health</h2>
                  <p className="text-sm text-green-100">Kingdom of Saudi Arabia</p>
                </div>
              </div>

              {/* Vision 2030 Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <span className="text-vision-gray font-bold text-lg">2030</span>
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold">Vision 2030</h2>
                  <p className="text-sm text-green-100">Digital Transformation</p>
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-2">تطعيمتي</h1>
            <h2 className="text-2xl font-semibold">Tateematy</h2>
            <p className="text-lg text-green-100">Blockchain-Verified Vaccination Certificate</p>
          </div>

          {/* Certificate Content */}
          <div className="p-8">
            {/* Certificate ID and Issue Date */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Certificate ID</p>
                <p className="text-lg font-bold text-gray-900">{certificate.certificateId}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Issue Date</p>
                <p className="text-lg font-bold text-gray-900">{certificate.issueDate}</p>
              </div>
            </div>

            {/* Child Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 text-moh-green mr-2" />
                  Child Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="font-medium text-gray-900">{certificate.childName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Child ID:</span>
                    <span className="font-medium text-gray-900">{certificate.childId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="font-medium text-gray-900">{certificate.dateOfBirth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parent/Guardian:</span>
                    <span className="font-medium text-gray-900">{certificate.parentName}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 text-accent-blue mr-2" />
                  Healthcare Provider
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-medium text-gray-900">{certificate.healthcareProvider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Facility:</span>
                    <span className="font-medium text-gray-900">{certificate.facility}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Blockchain Hash:</span>
                    <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {certificate.blockchainHash.slice(0, 10)}...{certificate.blockchainHash.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vaccinations Table */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 text-green-600 mr-2" />
                Vaccinations Administered
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                        Vaccine
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                        Dose
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                        Batch Number
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {certificate.vaccinations.map((vaccination, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-200">
                          {vaccination.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                          {vaccination.date}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                          {vaccination.dose}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                          {vaccination.batch}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Blockchain Verification */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 mb-8">
              <div className="flex items-center space-x-3 mb-3">
                <Shield className="w-6 h-6 text-moh-green" />
                <h4 className="text-lg font-semibold text-gray-900">Blockchain Verification</h4>
              </div>
              <p className="text-gray-700 mb-3">
                This certificate is verified and stored on the Ethereum blockchain. 
                The data is immutable and can be verified through the blockchain explorer.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">Hash:</span>
                <span className="font-mono bg-white px-2 py-1 rounded border">
                  {certificate.blockchainHash}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-100 text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>View on Blockchain</span>
              </button>

              <button className="bg-green-100 text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-green-200 transition-colors flex items-center justify-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </button>

              <button className="bg-purple-100 text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-purple-200 transition-colors flex items-center justify-center space-x-2">
                <QrCode className="w-5 h-5" />
                <span>Generate QR Code</span>
              </button>
            </div>
          </div>

          {/* Certificate Footer */}
          <div className="bg-gray-50 p-6 text-center">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-moh-green" />
                <span>Blockchain Verified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-accent-blue" />
                <span>Issued on {certificate.issueDate}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span>Certificate #{certificate.certificateId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Blockchain-verified authenticity</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Immutable vaccination records</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Official Ministry of Health format</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>QR code for quick verification</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Verify</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Use the "View on Blockchain" button</li>
              <li>2. Scan the QR code with your phone</li>
              <li>3. Check the blockchain hash manually</li>
              <li>4. Contact the healthcare provider</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaccinationCertificatePage;
