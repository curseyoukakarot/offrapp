import React from 'react';

export default function ClientLayout({ children, variant }) {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Sidebar from ClientDashboard */}
      <div id="sidebar" className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 transform lg:translate-x-0 transition-transform duration-300">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Offr.app</h1>
        </div>
        {/* Keep simple static nav; individual pages can render their own active states */}
        <nav className="mt-6 px-4">
          <span className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 mb-2 cursor-pointer">
            <i className="fa-solid fa-home w-5 h-5 mr-3"></i>
            <span className="font-medium">Dashboard</span>
          </span>
          <span className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 mb-2 cursor-pointer">
            <i className="fa-solid fa-folder w-5 h-5 mr-3"></i>
            <span className="font-medium">Files</span>
          </span>
          <span className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 mb-2 cursor-pointer">
            <i className="fa-solid fa-clipboard-list w-5 h-5 mr-3"></i>
            <span className="font-medium">Forms</span>
          </span>
        </nav>
      </div>

      {/* Header */}
      <div id="main-content" className="lg:ml-64 min-h-screen">
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
            </div>
          </div>
        </header>

        {/* Optional welcome banner space for pages to use; not forcing here */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}


