import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Users, Calendar, Award, ArrowRight, Heart, Target, Eye, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { authAPI } from '../lib/api';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import systemLogo from '../assets/images/logos/system-logo.png';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { showSuccess, showError, showInfo, toasts, removeToast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const connectWallet = async (userType: 'parent' | 'healthcare_provider' | 'admin') => {
    setIsConnecting(true);

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        showError('MetaMask Required', 'MetaMask is not installed. Please install MetaMask to continue.');
        setIsConnecting(false);
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        setIsConnected(true);
        
        showSuccess('Wallet Connected', `Wallet ${address.slice(0, 6)}...${address.slice(-4)} connected successfully!`);
        
        // Now process the wallet connection (login or auto-register)
        showInfo('Processing', 'Please sign the message to complete authentication...');
        await processWalletConnection(address, userType);
      }
    } catch (err) {
      showError('Connection Failed', 'Failed to connect wallet. Please try again.');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const processWalletConnection = async (address: string, userType: string) => {
    setIsProcessing(true);

    try {
      // Create a message for the user to sign
      const message = 'Connect wallet to Tateematy vaccination management system';
      
      // Request signature from user
      const signature = await window.ethereum!.request({
        method: 'personal_sign',
        params: [message, address]
      });

      // Try to connect wallet (this will either login existing user or create new parent)
      const response = await authAPI.connectWallet(address, signature, message);
      
      if (response.success) {
        if (response.data.user) {
          // User exists - check if profile is complete
          const { user: existingUser, token } = response.data;
          
          // Update the auth context directly
          updateUser(existingUser);
          
          // Store auth token
          if (token) {
            localStorage.setItem('authToken', token);
          }
          localStorage.setItem('walletAddress', address);
          
          // Check if profile is complete
          if (existingUser.profileComplete) {
            showSuccess('Login Successful', `Welcome back, ${existingUser.fullName || 'User'}!`);
            redirectToDashboard(existingUser.userType);
          } else {
            // Profile incomplete - redirect to profile completion
            showInfo('Profile Incomplete', 'Please complete your profile to continue.');
            navigate('/profile-completion');
          }
        } else {
          // User doesn't exist - handle based on user type
          if (userType === 'healthcare_provider') {
            // For doctors, don't auto-create - show error
            showError('Doctor Not Registered', 'This wallet address is not registered as a healthcare provider. Please contact an administrator to register your account.');
            showInfo('Registration Required', '💡 Doctor accounts must be created by an administrator first.');
            return; // Don't proceed with registration
          } else {
            // For parents, auto-create account
            await createUserAccount(address, signature, userType);
          }
        }
      } else {
        throw new Error(response.message || 'Failed to process wallet connection');
      }
    } catch (err: any) {
      console.error('Wallet processing error:', err);
      showError('Connection Failed', err.message || 'Failed to process wallet connection. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const createUserAccount = async (address: string, signature: string, userType: string) => {
    try {
      // Auto-create account with minimal required info only
      const userData = {
        walletAddress: address,
        userType: userType,
        // Don't send placeholder values - let user fill them in profile completion
        isVerified: false,
        profileComplete: false
      };

      console.log('Sending registration data:', userData);
      const response = await authAPI.register(userData);
      console.log('Registration response:', response);
      
      if (response.success) {
        // Store the user data and token
        const { user: newUser, token } = response.data;
        
        // Update the auth context directly
        updateUser(newUser);
        
        // Store auth token
        if (token) {
          localStorage.setItem('authToken', token);
        }
        localStorage.setItem('walletAddress', address);
        
        // Show success message and redirect to profile completion
        showSuccess('Account Created', 'Parent account created successfully! Please complete your profile.');
        // Always redirect to profile completion for new users
        navigate('/profile-completion');
      } else {
        throw new Error(response.message || 'Failed to create account');
      }
    } catch (err: any) {
      console.error('Account creation error:', err);
      if (err.response?.data?.errors) {
        // Show specific validation errors
        const errorMessages = err.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        showError('Registration Failed', `Registration failed: ${errorMessages}`);
      } else {
        showError('Registration Failed', err.message || 'Failed to create account. Please try again.');
      }
    }
  };

  const redirectToDashboard = (userType: string) => {
    switch (userType) {
      case 'parent':
        navigate('/parent');
        break;
      case 'healthcare_provider':
        navigate('/healthcare-provider');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/parent');
    }
  };

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
            {/* Direct wallet connection */}
            <button
              onClick={() => connectWallet('parent')}
              disabled={isConnecting || isProcessing}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-moh-green font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting || isProcessing ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 mr-2" />
                  Login/Register Parent
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
            

            
            <button
              onClick={() => connectWallet('healthcare_provider')}
              disabled={isConnecting || isProcessing}
              className="inline-flex items-center justify-center px-8 py-4 bg-accent-blue text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting || isProcessing ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Login Doctor
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
          
          {/* Help Text */}
          <div className="mt-4 text-center text-white/80 text-sm">
            <p><strong>Parents:</strong> Click "Login/Register Parent" to create a new account or login with existing wallet</p>
            <p><strong>Doctors:</strong> Click "Login Doctor" to login with your admin-registered wallet (no auto-registration)</p>
          </div>

          {/* Wallet Connection Status */}
          {isConnected && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-center space-x-3 text-white">
                  <CheckCircle className="w-6 h-6 text-green-300" />
                  <span className="font-medium">Wallet Connected!</span>
                </div>
                {walletAddress && (
                  <p className="text-center text-green-100 text-sm mt-2 font-mono">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                )}
                {isProcessing && (
                  <div className="flex items-center justify-center space-x-2 text-green-200 mt-3">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Setting up your account...</span>
                  </div>
                )}
              </div>
            </div>
          )}


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
            <button
              onClick={() => connectWallet('parent')}
              disabled={isConnecting || isProcessing}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-moh-green font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting || isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Login/Register</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
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
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default HomePage;
