import React from 'react';
import { Shield, Database, Lock, Globe, Users, Award } from 'lucide-react';
import systemLogo from '../assets/images/logos/system-logo.png';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img 
              src={systemLogo} 
              alt="Tateematy System Logo" 
              className="w-[400px] h-auto object-contain max-w-full"
            />
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A revolutionary blockchain-based vaccination management system designed to transform 
            healthcare delivery in Saudi Arabia
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left Column - Illustration Placeholder */}
          <div className="order-2 lg:order-1">
            <div className="bg-gradient-to-br from-moh-green/10 to-accent-blue/10 rounded-3xl p-12 text-center">
              <div className="w-32 h-32 bg-moh-green rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Illustration Placeholder</h3>
              <p className="text-gray-600">
                This space will contain visual representations of our blockchain technology, 
                vaccination process, and system architecture.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <Database className="w-8 h-8 text-moh-green mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Blockchain</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <Lock className="w-8 h-8 text-accent-blue mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Security</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Information */}
          <div className="order-1 lg:order-2">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Secure Blockchain-Based Vaccination Records
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Tateematy leverages cutting-edge blockchain technology to create an immutable, 
                  transparent, and secure system for managing children's vaccination records. 
                  Every vaccination event is recorded on the Ethereum blockchain, ensuring 
                  data integrity and preventing tampering.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-moh-green rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Immutable Records</h4>
                    <p className="text-sm text-gray-600">Once recorded, vaccination data cannot be altered or deleted</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Transparent Access</h4>
                    <p className="text-sm text-gray-600">Authorized users can verify vaccination records in real-time</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Multi-Stakeholder</h4>
                    <p className="text-sm text-gray-600">Parents, doctors, and administrators all have secure access</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Reward System</h4>
                    <p className="text-sm text-gray-600">Token incentives for completing vaccination schedules</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack Section */}
        <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Technology Stack
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built with modern, secure, and scalable technologies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl">
              <div className="w-16 h-16 bg-moh-green rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Blockchain</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Ethereum Holesky Testnet</li>
                <li>Solidity Smart Contracts</li>
                <li>IPFS for Certificate Storage</li>
                <li>MetaMask Integration</li>
              </ul>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl">
              <div className="w-16 h-16 bg-accent-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Backend</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Node.js & Express.js</li>
                <li>MongoDB Database</li>
                <li>JWT Authentication</li>
                <li>RESTful APIs</li>
              </ul>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-green-50 rounded-2xl">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Frontend</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>React.js with TypeScript</li>
                <li>Tailwind CSS</li>
                <li>Shadcn UI Components</li>
                <li>Responsive Design</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Vision 2030 Alignment */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center space-x-3 bg-vision-gray text-white px-8 py-4 rounded-full mb-8">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-vision-gray font-bold text-sm">2030</span>
            </div>
            <span className="font-semibold">Vision 2030 Initiative</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Supporting Saudi Arabia's Digital Transformation
          </h3>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Tateematy aligns with Saudi Vision 2030's goals of digital transformation, 
            healthcare innovation, and building a knowledge-based economy. Our system 
            demonstrates how blockchain technology can revolutionize public health services 
            while maintaining the highest standards of security and privacy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
