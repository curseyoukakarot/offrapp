import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';

export default function ClientLayout({ children, variant }) {
  const { signOut } = useAuth();
  return (
    <div className="bg-gray-50 min-h-screen flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 ml-64">
        <header id="header" className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              <i className="fa-solid fa-bars text-gray-600"></i>
            </button>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <i className="fa-solid fa-bell text-gray-600"></i>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="User" className="w-8 h-8 rounded-full" />
              <button title="Sign out" onClick={signOut} className="p-2 text-gray-600 hover:text-gray-900">
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}


