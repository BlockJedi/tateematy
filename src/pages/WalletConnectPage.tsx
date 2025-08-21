import React, { useState } from 'react';
import { Shield, ArrowRight, CheckCircle, AlertCircle, User, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WalletConnectPage: React.FC = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');

  const handleRoleSelection = (role: string) => {
    setSelectedRole(role);
    if (role === 'parent') {
      navigate('/parent');
    } else if (role === 'healthcare-provider') {
      navigate('/healthcare-provider');
    }
  };

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
        setIsConnected(true);
        setShowRoleSelection(true);
        // Here you would typically handle the connection logic
        console.log('Connected account:', accounts[0]);
      }
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
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
          </div>

          {/* Connection Status */}
          {!isConnected ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-600 text-sm">
                  Connect your MetaMask wallet to access the Tateematy vaccination management system
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
                    <span>Connect with MetaMask</span>
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
              {!showRoleSelection ? (
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Wallet Connected!
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Your MetaMask wallet has been successfully connected to Tateematy
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Select Your Role
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Choose how you want to access Tateematy
                  </p>
                </div>
              )}

              {!showRoleSelection ? (
                <button 
                  onClick={() => setShowRoleSelection(true)}
                  className="w-full bg-moh-green text-white font-semibold py-3 px-6 rounded-xl hover:bg-green-600 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => handleRoleSelection('parent')}
                    className="w-full bg-moh-green text-white font-semibold py-3 px-6 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Users className="w-5 h-5" />
                    <span>Login as Parent/Guardian</span>
                  </button>
                  
                  <button
                    onClick={() => handleRoleSelection('healthcare-provider')}
                    className="w-full bg-accent-blue text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Login as Healthcare Provider</span>
                  </button>
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
            <h3 className="font-semibold text-gray-900 mb-3">Why MetaMask?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Secure authentication using blockchain technology</p>
              <p>• No passwords to remember or lose</p>
              <p>• Complete control over your data and privacy</p>
              <p>• Compatible with Tateematy's blockchain system</p>
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
