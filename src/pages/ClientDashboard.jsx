import React, { useState } from 'react';

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('files');

  const tabBtn = (key, label, icon) => (
    <button
      className={`tab-button px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
        activeTab === key ? 'text-white tab-active' : 'text-gray-600 hover:text-gray-900'
      }`}
      data-tab={key}
      onClick={() => setActiveTab(key)}
    >
      <i className={`fa-solid ${icon} mr-2`}></i>
      {label}
    </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <div id="sidebar" className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 transform lg:translate-x-0 transition-transform duration-300">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Offr.app</h1>
        </div>

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

          <div className="mt-6">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Embedded Tools</h3>
            <span className="flex items-center px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-200 mb-1 cursor-pointer">
              <i className="fa-solid fa-calendar w-4 h-4 mr-3"></i>
              <span className="text-sm">Calendly</span>
            </span>
            <span className="flex items-center px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-200 mb-1 cursor-pointer">
              <i className="fa-solid fa-tasks w-4 h-4 mr-3"></i>
              <span className="text-sm">Monday.com</span>
            </span>
            <span className="flex items-center px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-200 mb-1 cursor-pointer">
              <i className="fa-solid fa-book w-4 h-4 mr-3"></i>
              <span className="text-sm">Notion</span>
            </span>
          </div>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center">
            <img
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg"
              alt="User"
              className="w-10 h-10 rounded-full"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Sarah Chen</p>
              <p className="text-xs text-gray-500">Client Account</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="main-content" className="lg:ml-64 min-h-screen">
        {/* Header */}
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
              <img
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg"
                alt="User"
                className="w-8 h-8 rounded-full"
              />
            </div>
          </div>
        </header>

        {/* Welcome Banner */}
        <div id="welcome-banner" className="p-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Welcome back, Sarah!</h2>
                <p className="text-blue-100 text-lg">You have 2 pending tasks to complete</p>
              </div>
              <div className="flex items-center">
                <div className="relative w-20 h-20">
                  <svg className="progress-ring w-20 h-20" viewBox="0 0 84 84">
                    <circle cx="42" cy="42" r="38" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none"></circle>
                    <circle cx="42" cy="42" r="38" stroke="white" strokeWidth="6" fill="none" strokeDasharray="239" strokeDashoffset="71.7"></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">70%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center">
                <div className="task-check completed w-6 h-6 bg-green-400 rounded-full flex items-center justify-center mr-4">
                  <i className="fa-solid fa-check text-white text-sm"></i>
                </div>
                <span className="text-blue-100 line-through">Review project brief</span>
              </div>
              <div className="flex items-center">
                <div className="task-check w-6 h-6 border-2 border-white rounded-full mr-4"></div>
                <span>Upload required documents</span>
              </div>
              <div className="flex items-center">
                <div className="task-check w-6 h-6 border-2 border-white rounded-full mr-4"></div>
                <span>Complete intake form</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div id="dashboard-tabs" className="px-6 mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabBtn('files', 'Files', 'fa-folder')}
            {tabBtn('forms', 'Forms', 'fa-clipboard-list')}
            {tabBtn('pages', 'Pages', 'fa-external-link-alt')}
          </div>
        </div>

        {/* Files Tab */}
        <div id="files-tab" className={`tab-content px-6 ${activeTab === 'files' ? '' : 'hidden'}`}>
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-file-arrow-down text-blue-600"></i>
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">3 files from admin</p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 font-medium">View All</button>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h3>
            <div className="upload-zone rounded-lg p-8 text-center">
              <i className="fa-solid fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
              <p className="text-lg font-medium text-gray-900 mb-2">Drag and drop files here</p>
              <p className="text-gray-500 mb-4">or click to browse</p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Select Files
              </button>
            </div>
          </div>

          {/* File Filters */}
          <div className="flex space-x-4 mb-6">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">All Files</button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Sent by Admin</button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Uploaded by Me</button>
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-file-pdf text-red-600 text-xl"></i>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">From Admin</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Project Brief.pdf</h4>
              <p className="text-sm text-gray-500 mb-4">2 hours ago</p>
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">View</button>
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                  <i className="fa-solid fa-download"></i>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-file-word text-blue-600 text-xl"></i>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Uploaded</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Requirements.docx</h4>
              <p className="text-sm text-gray-500 mb-4">1 day ago</p>
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">View</button>
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                  <i className="fa-solid fa-download"></i>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-file-excel text-green-600 text-xl"></i>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">From Admin</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Budget Template.xlsx</h4>
              <p className="text-sm text-gray-500 mb-4">3 days ago</p>
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">View</button>
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                  <i className="fa-solid fa-download"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Forms Tab */}
        <div id="forms-tab" className={`tab-content px-6 ${activeTab === 'forms' ? '' : 'hidden'}`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-clipboard-list text-orange-600"></i>
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">1 form pending</p>
                  <p className="text-sm text-gray-500">Intake form needs completion</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-clipboard-list text-orange-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Client Intake Form</h4>
                    <p className="text-sm text-gray-500">Required information for project setup</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">Not Started</span>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                    Start
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-check-circle text-green-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Project Preferences</h4>
                    <p className="text-sm text-gray-500">Design and functionality preferences</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Completed</span>
                  <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pages Tab */}
        <div id="pages-tab" className={`tab-content px-6 ${activeTab === 'pages' ? '' : 'hidden'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-hover">
              <div className="h-40 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <i className="fa-solid fa-calendar text-white text-4xl"></i>
              </div>
              <div className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Calendly Scheduler</h4>
                <p className="text-sm text-gray-500 mb-4">Book meetings and consultations</p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                  Open Tool
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-hover">
              <div className="h-40 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <i className="fa-solid fa-tasks text-white text-4xl"></i>
              </div>
              <div className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Monday.com Board</h4>
                <p className="text-sm text-gray-500 mb-4">Track project progress and tasks</p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                  Open Tool
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-hover">
              <div className="h-40 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                <i className="fa-solid fa-book text-white text-4xl"></i>
              </div>
              <div className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Notion Workspace</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


