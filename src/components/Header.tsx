import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import tateematyLogo from '../assets/images/logos/tateematy-logo.png';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const publicNavigation = [
    { name: 'Home', href: '/' },
    { name: 'About the Project', href: '/about' },
    { name: 'Statistics', href: '/statistics' },
    { name: 'Vaccination Schedule', href: '/vaccination-schedule' },
    { name: 'Contact Us', href: '/contact' },
  ];

  const authenticatedNavigation = [
    { name: 'Dashboard', href: user?.userType === 'parent' ? '/parent' : user?.userType === 'healthcare_provider' ? '/healthcare-provider' : '/admin' },
    { name: 'Certificates', href: '/certificate' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const handleAdminWalletConnect = async () => {
    if (typeof window.ethereum === 'undefined') {
      setWalletError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setIsConnectingWallet(true);
      setWalletError(null);

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];

      if (!walletAddress) {
        setWalletError('No wallet address found. Please connect your wallet.');
        return;
      }

      // Request signature for authentication
      const message = `Admin Authentication: ${walletAddress}`;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      });

      // Call backend to verify admin status
      const response = await fetch('http://localhost:5001/api/auth/admin-connect-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message
        })
      });

      const data = await response.json();

      if (data.success) {
        // Admin login successful - update authentication state
        const { user: adminUser, token } = data.data;
        
        // Store the auth token
        localStorage.setItem('authToken', token);
        localStorage.setItem('walletAddress', walletAddress);
        
        // Update the auth context with the admin user
        updateUser(adminUser);
        
        // Navigate to admin dashboard
        navigate('/admin');
        setWalletError(null);
      } else {
        setWalletError(data.message || 'You are not an admin. Access denied.');
      }
    } catch (error: any) {
      console.error('Admin wallet connection error:', error);
      setWalletError(error.message || 'Failed to connect wallet. Please try again.');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            {/* Tateematy Logo */}
            <div className="flex items-center">
              <img 
                src={tateematyLogo} 
                alt="Tateematy" 
                className="w-56 h-44 object-contain"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {/* Public Navigation */}
            {publicNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-moh-green bg-green-50'
                    : 'text-gray-700 hover:text-moh-green hover:bg-green-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Authenticated Navigation */}
            {isAuthenticated && authenticatedNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-moh-green bg-green-50'
                    : 'text-gray-700 hover:text-moh-green hover:bg-green-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:text-moh-green hover:bg-green-50 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.fullName || 'User'}
                  </span>
                </button>
                
                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      <div className="font-medium">{user?.fullName}</div>
                      <div className="text-gray-500 capitalize">{user?.userType}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Connect Wallet button - Admin only */
              <div className="relative">
                <button
                  onClick={handleAdminWalletConnect}
                  disabled={isConnectingWallet}
                  className="flex items-center space-x-2 px-4 py-2 bg-moh-green text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wallet className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {isConnectingWallet ? 'Connecting...' : 'Connect Wallet (Admin)'}
                  </span>
                </button>
                
                {/* Wallet Error Display */}
                {walletError && (
                  <div className="absolute top-full mt-2 right-0 w-80 bg-red-50 border border-red-200 rounded-lg p-3 z-50">
                    <div className="flex items-center">
                      <div className="w-4 h-4 text-red-500 mr-2">⚠️</div>
                      <span className="text-red-700 text-sm">{walletError}</span>
                    </div>
                    <button
                      onClick={() => setWalletError(null)}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-moh-green hover:bg-green-50 rounded-md transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              {/* Public Navigation */}
              {publicNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-moh-green bg-green-50'
                      : 'text-gray-700 hover:text-moh-green hover:bg-green-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Authenticated Navigation */}
              {isAuthenticated && authenticatedNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-moh-green bg-green-50'
                      : 'text-gray-700 hover:text-moh-green hover:bg-green-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Admin Connect Button for Mobile */}
              {!isAuthenticated && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleAdminWalletConnect();
                  }}
                  disabled={isConnectingWallet}
                  className="w-full text-left px-3 py-2 text-base font-medium text-moh-green hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-5 h-5" />
                    <span>
                      {isConnectingWallet ? 'Connecting...' : 'Connect Wallet (Admin)'}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
