import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Bell, User } from 'lucide-react';
import tateematyLogo from '../assets/images/logos/tateematy-logo.png';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About the Project', href: '/about' },
    { name: 'Statistics', href: '/statistics' },
    { name: 'Vaccination Schedule', href: '/vaccination-schedule' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Admin', href: '/admin' },
  ];

  const isActive = (path: string) => location.pathname === path;

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
            {navigation.map((item) => (
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
            {/* Notifications - Hidden for now, only shown in parent dashboard */}
            {/* <button className="p-2 text-gray-600 hover:text-moh-green hover:bg-green-50 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
            </button> */}

            {/* User Menu - Hidden for now */}
            {/* <div className="relative">
              <button className="flex items-center space-x-2 p-2 text-gray-700 hover:text-moh-green hover:bg-green-50 rounded-lg transition-colors">
                <User className="w-5 h-5" />
                <span className="hidden sm:block text-sm font-medium">Login</span>
              </button>
            </div> */}

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
              {navigation.map((item) => (
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
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
