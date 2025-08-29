import React from 'react';
import { Link } from 'react-router-dom';
import mohLogo from '../assets/images/logos/moh-logo.png';
import vision2030Logo from '../assets/images/logos/vision2030-logo.png';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Ministry of Health Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={mohLogo} 
                alt="Ministry of Health" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h3 className="text-lg font-semibold">Ministry of Health</h3>
                <p className="text-sm text-gray-300">Kingdom of Saudi Arabia</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Tateematy (تطعيمتي) is a blockchain-based vaccination management system 
              designed to provide secure, transparent, and efficient immunization tracking 
              for children across Saudi Arabia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/vaccination-schedule" className="hover:text-white transition-colors">Schedule</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Vision 2030 */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Vision 2030</h4>
            <div className="flex items-center space-x-2 mb-3">
              <img 
                src={vision2030Logo} 
                alt="Vision 2030" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-sm text-gray-300">Digital Transformation</span>
            </div>
            <p className="text-gray-300 text-sm">
              Supporting Saudi Arabia's digital transformation goals through 
              innovative healthcare technology solutions.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
              © 2025 Nurayn Almosa supervised by Dr.Shada Salamh at King Saud University
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
