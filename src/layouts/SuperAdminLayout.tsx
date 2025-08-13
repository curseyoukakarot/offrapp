import React from 'react';
import { Link } from 'react-router-dom';
import CommandPalette from '../components/CommandPalette';

type Props = { children: React.ReactNode };

export default function SuperAdminLayout({ children }: Props) {
  const onSuspend = () => {};
  const onImpersonate = () => {};
  const onPurgeCache = () => {};
  const onRebuildIndex = () => {};

  return (
    <div className="bg-gray-50">
      {/* Top Bar */}
      <div id="top-bar" className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-database text-white text-sm"></i>
            </div>
            <span className="font-semibold text-gray-900">NestBase</span>
          </div>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">PROD</span>
        </div>

        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm">
            <i className="fa-solid fa-search text-gray-500"></i>
            <span className="text-gray-600">Command Palette</span>
            <span className="text-xs text-gray-400">⇧⌘K</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-300">
            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" className="w-8 h-8 rounded-full" alt="Admin" />
          </div>
        </div>
      </div>

      {/* Sticky Ops Bar */}
      <div id="ops-bar" className="bg-blue-600 text-white px-6 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Quick Actions:</span>
          <button className="bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded text-sm" onClick={onSuspend}>Suspend</button>
          <button className="bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded text-sm" onClick={onImpersonate}>Impersonate</button>
          <button className="bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded text-sm" onClick={onPurgeCache}>Purge Cache</button>
          <button className="bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded text-sm" onClick={onRebuildIndex}>Rebuild Index</button>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <span className="flex items-center space-x-1">
            <i className="fa-solid fa-circle text-green-400"></i>
            <span>99.9% Uptime</span>
          </span>
          <span>847 Active Users</span>
          <span>23 Queued Jobs</span>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div id="sidebar" className="w-64 bg-white border-r border-gray-200 h-screen sticky top-16">
          <nav className="p-4 space-y-2">
            <Link to="/super" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-gauge-high"></i>
              <span className="font-medium">Overview</span>
            </Link>
            <Link to="/super/tenants" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-building"></i>
              <span>Tenants &amp; Domains</span>
              <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs">142</span>
            </Link>
            <Link to="/super/users" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-users"></i>
              <span>Users &amp; Roles</span>
              <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs">2.1k</span>
            </Link>
            <span className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-credit-card"></i>
              <span>Billing</span>
            </span>
            <Link to="/super/health" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-heart-pulse"></i>
              <span>App Health</span>
              <span className="ml-auto bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">3</span>
            </Link>
            <Link to="/super/jobs" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-list-check"></i>
              <span>Queues &amp; Jobs</span>
              <span className="ml-auto bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">23</span>
            </Link>
            <Link to="/super/integrations" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-puzzle-piece"></i>
              <span>Integrations</span>
            </Link>
            <Link to="/super/notifications" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-bell"></i>
              <span>Notifications</span>
            </Link>
            <Link to="/super/settings" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-gear"></i>
              <span>Settings</span>
            </Link>
            <Link to="/super/audit" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-clipboard-list"></i>
              <span>Audit Logs</span>
            </Link>
            <span className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-gear"></i>
              <span>Settings</span>
            </span>
          </nav>
        </div>

        {/* Main Content */}
        <div id="main-content" className="flex-1 p-6">
          {children}
        </div>
      </div>

      {/* Mounted inside Router context */}
      <CommandPalette />
    </div>
  );
}


