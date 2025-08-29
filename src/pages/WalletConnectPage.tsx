import React, { useState } from 'react';
import { Shield, ArrowRight, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { authAPI } from '../lib/api';

const WalletConnectPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const connectWallet = async () => {
    setIsConnecting(true);
    setError('');

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask is not installed. Please install MetaMask to continue.');
        setIsConnecting(false);
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        setIsConnected(true);
        
        // Now process the wallet connection (login or auto-register)
        await processWalletConnection(address);
      }
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const processWalletConnection = async (address: string) => {
    setIsProcessing(true);
    setError('');

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
          // User exists - login and redirect
          await login(address, signature);
          redirectToDashboard(response.data.user.userType);
        } else {
          // User doesn't exist - auto-create parent account
          await createParentAccount(address, signature);
        }
      } else {
        throw new Error(response.message || 'Failed to process wallet connection');
      }
    } catch (err: any) {
      console.error('Wallet processing error:', err);
      setError(err.message || 'Failed to process wallet connection. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const createParentAccount = async (address: string, signature: string) => {
    try {
      // Auto-create parent account with basic info
      const parentData = {
        walletAddress: address,
        userType: 'parent',
        fullName: `Parent_${address.slice(0, 6)}`, // Temporary name
        email: `${address.slice(0, 8)}@tateematy.com`, // Temporary email
        mobile: '+966500000000', // Default Saudi mobile
        // Generate a temporary 10-digit national ID based on wallet address and timestamp
        nationalId: `1${address.slice(2, 6)}${Date.now().toString().slice(-5)}`, // Temporary unique ID (1 + 4 + 5 = 10 digits)
        isVerified: false, // Will need verification later
        profileComplete: false // Will need profile completion later
      };

      // Debug: Log the generated national ID
      console.log('Generated national ID:', parentData.nationalId, 'Length:', parentData.nationalId.length);
      console.log('Sending registration data:', parentData);
      const response = await authAPI.register(parentData);
      console.log('Registration response:', response);
      
      if (response.success) {
        // Login with the newly created account
        await login(address, signature);
        redirectToDashboard('parent');
      } else {
        throw new Error(response.message || 'Failed to create parent account');
      }
    } catch (err: any) {
      console.error('Account creation error:', err);
      if (err.response?.data?.errors) {
        // Show specific validation errors
        const errorMessages = err.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        setError(`Registration failed: ${errorMessages}`);
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
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
    <div className="min-h-screen bg-gradient-to-br from-moh-green/5 to-accent-blue/5 flex items-center justify-center py-20">
      <div className="max-w-md w-full mx-auto px-4">
        {/* Tateematy Logo Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-moh-green to-accent-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">تطعيمتي</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tateematy</h1>
            <p className="text-sm text-gray-600 font-tajawal">تطعيمتي</p>
            <p className="text-xs text-gray-500 mt-1">Vaccination Management System</p>
          </div>

          {/* Connection Status */}
          {!isConnected ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Login or Register
                </h2>
                <p className="text-gray-600 text-sm">
                  Connect your MetaMask wallet to login or register with Tateematy. 
                  New users will automatically be registered as parents. 
                  Healthcare providers can update their role after first login.
                </p>
              </div>

              {/* MetaMask Button */}
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-moh-green to-accent-blue text-white font-semibold py-4 px-6 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">🦊</span>
                    </div>
                    <span>Login/Register with MetaMask</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              {/* MetaMask Installation Guide */}
              {error && error.includes('not installed') && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Install MetaMask</h3>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Visit <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="underline">metamask.io</a></li>
                    <li>2. Click "Download" and install the extension</li>
                    <li>3. Create a new wallet or import existing one</li>
                    <li>4. Return here and try connecting again</li>
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Wallet Connected!
                </h2>
                <p className="text-gray-600 text-sm">
                  {isProcessing ? 'Processing your wallet...' : 'Processing wallet connection...'}
                </p>
                {walletAddress && (
                  <p className="text-xs text-gray-500 mt-2 font-mono">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                )}
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center space-x-2 text-moh-green">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Setting up your account...</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Security Note */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <Shield className="w-4 h-4" />
              <span className="text-xs">Secure blockchain connection</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">How It Works</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Connect your MetaMask wallet securely</p>
              <p>• If you're a returning user → Login automatically</p>
              <p>• If you're new → Auto-register as parent</p>
              <p>• Complete your profile after first login</p>
              <p>• Healthcare providers can update their role later</p>
            </div>
          </div>
        </div>

        {/* Ministry of Health Branding */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-4 text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-moh-green rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">MoH</span>
              </div>
              <span className="text-xs">Ministry of Health</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-vision-gray rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">2030</span>
              </div>
              <span className="text-xs">Vision 2030</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectPage;
