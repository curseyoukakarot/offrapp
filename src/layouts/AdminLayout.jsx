import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ScopeHeader } from '../components/ScopeHeader';

export default function AdminLayout({ children }) {
  const { signOut } = useAuth();
  return (
    <div className="bg-bg">
      {/* Header from AdminDashboard */}
      <header id="header" className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="text-xl font-semibold text-text">NestBase Admin</span>
            </div>
            <div className="text-gray text-sm">Dashboard</div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input type="text" placeholder="Search users, files, forms..." className="w-80 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors" />
              <i className="fa-solid fa-search absolute left-3 top-3 text-gray text-sm"></i>
            </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray hover:text-text transition-colors">
              <i className="fa-solid fa-bell"></i>
            </button>
            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" className="w-8 h-8 rounded-full" alt="Admin" />
            <button title="Sign out" onClick={signOut} className="p-2 text-gray-600 hover:text-gray-900">
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
          </div>
        </div>
      </header>

      <ScopeHeader />

      <div className="flex">
        {/* Sidebar from AdminDashboard */}
        <aside id="sidebar" className="w-64 bg-white border-r border-gray-200 h-screen sticky top-16">
          <nav className="p-4 space-y-2">
            <Link to="/dashboard/admin" className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary/10 border-right-2 border-primary text-primary cursor-pointer">
              <i className="fa-solid fa-chart-line"></i>
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link to="/crm/users" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray hover:bg-gray-50 transition-colors cursor-pointer">
              <i className="fa-solid fa-users"></i>
              <span>User Management</span>
            </Link>
            <Link to="/admin/files" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray hover:bg-gray-50 transition-colors cursor-pointer">
              <i className="fa-solid fa-cloud-upload"></i>
              <span>File Upload</span>
            </Link>
            <Link to="/dashboard/admin/settings" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray hover:bg-gray-50 transition-colors cursor-pointer">
              <i className="fa-solid fa-gear"></i>
              <span>Settings</span>
            </Link>
            <div className="pt-4">
              <div className="flex items-center justify-between px-3 py-2 text-gray text-sm font-medium">
                <span>Embedded Tools</span>
                <i className="fa-solid fa-chevron-down"></i>
              </div>
              <div className="ml-4 space-y-1">
                <Link to="/admin-embeds" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray hover:bg-gray-50 transition-colors cursor-pointer">
                  <i className="fa-solid fa-desktop"></i>
                  <span>Dashboard Screens</span>
                </Link>
                <Link to="/forms" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray hover:bg-gray-50 transition-colors cursor-pointer">
                  <i className="fa-solid fa-clipboard-list"></i>
                  <span>Forms</span>
                </Link>
              </div>
            </div>
          </nav>
        </aside>

        <main id="main-content" className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}


