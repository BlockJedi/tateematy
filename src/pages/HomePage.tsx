import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Calendar, Award, ArrowRight, Heart, Target, Eye } from 'lucide-react';
import systemLogo from '../assets/images/logos/system-logo.png';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-moh-green via-green-600 to-accent-blue text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-2">
            <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Blockchain-Powered Healthcare</span>
            </div>
          </div>
          
          <div className="flex justify-center mb-2 -my-2">
            <img 
              src={systemLogo} 
              alt="Tateematy System Logo" 
              className="w-[500px] h-auto object-contain max-w-full scale-110"
            />
          </div>
          
          <p className="text-xl md:text-2xl text-green-100 mb-4 max-w-3xl mx-auto leading-relaxed">
            Secure, transparent, and efficient vaccination management system for children across Saudi Arabia
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Direct login without wallet connection */}
            <Link
              to="/parent"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-moh-green font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Login as Parent/Guardian
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            
            <Link
              to="/healthcare-provider"
              className="inline-flex items-center justify-center px-8 py-4 bg-accent-blue text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
            >
              <Shield className="w-5 h-5 mr-2" />
              Login as Healthcare Provider
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            
            {/* Wallet connection commented out for now */}
            {/* <Link
              to="/connect-wallet"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-moh-green font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Connect Wallet to Login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link> */}
          </div>
        </div>
      </section>

      {/* Mission, Vision, Supervised By Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mission */}
            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border border-green-100">
              <div className="w-16 h-16 bg-moh-green rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To provide a secure, transparent, and efficient vaccination tracking system 
                that ensures every child receives timely immunizations while maintaining 
                complete digital records on the blockchain.
              </p>
            </div>

            {/* Vision */}
            <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl border border-blue-100">
              <div className="w-16 h-16 bg-accent-blue rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To become the leading digital vaccination management platform in the region, 
                setting new standards for healthcare transparency and efficiency through 
                innovative blockchain technology.
              </p>
            </div>

            {/* Supervised By */}
            <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl border border-gray-100">
              <div className="w-16 h-16 bg-vision-gray rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Supervised By</h3>
              <p className="text-gray-600 leading-relaxed">
                Ministry of Health, Kingdom of Saudi Arabia, in alignment with Vision 2030 
                goals for digital transformation and healthcare innovation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex flex-col items-center mb-4">
              <img 
                src={systemLogo} 
                alt="Tateematy System Logo" 
                className="w-32 h-auto object-contain mb-4 scale-110"
              />
              <h2 className="text-4xl font-bold text-gray-900">
                Why Choose Our System?
              </h2>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our blockchain-based system provides unmatched security, transparency, and efficiency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-moh-green rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Blockchain Security</h3>
              <p className="text-gray-600 text-sm">
                Immutable records stored on the Ethereum blockchain for maximum security
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-accent-blue rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Reminders</h3>
              <p className="text-gray-600 text-sm">
                Automated SMS reminders for upcoming vaccinations
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Token Rewards</h3>
              <p className="text-gray-600 text-sm">
                Earn VaccineToken rewards for completing vaccination schedules
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Child Health</h3>
              <p className="text-gray-600 text-sm">
                Comprehensive health tracking and digital certificates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-moh-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of families and healthcare providers already using our system 
            to manage children's vaccinations securely and efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/parent"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-moh-green font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-moh-green transition-colors"
            >
              Learn More
            </Link>
            
            {/* Wallet connection commented out for now */}
            {/* <Link
              to="/connect-wallet"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-moh-green font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Connect Your Wallet
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link> */}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
