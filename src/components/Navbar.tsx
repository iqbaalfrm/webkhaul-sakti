import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, BarChart3 } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">NU</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">SAKTI</h1>
          </div>
          
          <div className="flex space-x-4">
            <Link
              to="/dashboard"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                isActive('/dashboard') || isActive('/')
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              <BarChart3 size={18} />
              <span className="font-medium">Dashboard</span>
            </Link>
            
            <Link
              to="/form"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                isActive('/form')
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              <FileText size={18} />
              <span className="font-medium">Input Data</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;