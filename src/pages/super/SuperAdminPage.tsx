import React, { useEffect } from 'react';
import Highcharts from 'highcharts';
import type { Options as HighchartsOptions, SeriesOptionsType } from 'highcharts';

export default function SuperAdminPage() {
  useEffect(() => {
    const load = async () => {
      // Fetch metrics
      const [uptimeRes, usersRes, storageRes, jobsRes, reqErrRes] = await Promise.all([
        fetch('/api/metrics/uptime'),
        fetch('/api/metrics/active-users'),
        fetch('/api/metrics/storage'),
        fetch('/api/metrics/jobs'),
        fetch('/api/metrics/requests-errors?window=24h'),
      ]);
      const uptime = await uptimeRes.json();
      const users = await usersRes.json();
      const storage = await storageRes.json();
      const jobs = await jobsRes.json();
      const reqErr = await reqErrRes.json();

      // Requests Chart
      const requestsEl = document.getElementById('requests-chart');
      if (requestsEl) {
        const requestsOptions: HighchartsOptions = {
          chart: { type: 'spline', backgroundColor: 'transparent' },
          title: { text: undefined },
          xAxis: { categories: reqErr.x },
          yAxis: [{ title: { text: 'Requests/min' } }, { title: { text: 'Errors' }, opposite: true }],
          series: [
            { type: 'spline', name: 'Requests', data: reqErr.requests, color: '#3B82F6' },
            { type: 'spline', name: 'Errors', data: reqErr.errors, color: '#EF4444', yAxis: 1 },
          ] as SeriesOptionsType[],
          legend: { enabled: false },
          credits: { enabled: false },
        };
        (Highcharts as any).chart(requestsEl as HTMLElement, requestsOptions);
      }

      // Queue Chart (using jobs queued as last point; keep placeholder trend)
      const queueEl = document.getElementById('queue-chart');
      if (queueEl) {
        const trend = [45, 32, 28, 35, 42, jobs.queued || 23];
        const queueOptions: HighchartsOptions = {
          chart: { type: 'area', backgroundColor: 'transparent' },
          title: { text: undefined },
          xAxis: { categories: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'] },
          yAxis: { title: { text: 'Queue Depth' } },
          series: [
            { type: 'area', name: 'Jobs', data: trend, color: '#8B5CF6', fillOpacity: 0.3 },
          ] as SeriesOptionsType[],
          legend: { enabled: false },
          credits: { enabled: false },
        };
        (Highcharts as any).chart(queueEl as HTMLElement, queueOptions);
      }

      // Update metric chips (using DOM to preserve exact structure)
      const uptimeEls = document.querySelectorAll('#status-cards span.bg-green-100');
      if (uptimeEls[0]) uptimeEls[0].textContent = `${uptime.p24h}%`;
      const activeUsersLabel = document.querySelector('#status-cards h3 + p');
      if (activeUsersLabel) activeUsersLabel.textContent = `${users.today} today • ${users.tenants} tenants`;
      const storageBadge = document.querySelector('#status-cards .bg-yellow-100');
      if (storageBadge) storageBadge.textContent = `${Math.round((storage.usedTb / storage.quotaTb) * 100)}%`;
    };
    load();
  }, []);

  // Handlers (stubbed – to be wired to APIs)
  const onSuspend = () => {};
  const onImpersonate = () => {};
  const onPurgeCache = () => {};
  const onRebuildIndex = () => {};
  const onCreateTenant = () => {};
  const onNotifyAdmins = () => {};

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
            <span className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 cursor-pointer">
              <i className="fa-solid fa-gauge-high"></i>
              <span className="font-medium">Overview</span>
            </span>
            <span className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-building"></i>
              <span>Tenants &amp; Domains</span>
              <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs">142</span>
            </span>
            <span className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-users"></i>
              <span>Users &amp; Roles</span>
              <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs">2.1k</span>
            </span>
            <span className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-credit-card"></i>
              <span>Billing</span>
            </span>
            <span className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-heart-pulse"></i>
              <span>App Health</span>
              <span className="ml-auto bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">3</span>
            </span>
            <span className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-list-check"></i>
              <span>Queues &amp; Jobs</span>
              <span className="ml-auto bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">23</span>
            </span>
            <span className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-puzzle-piece"></i>
              <span>Integrations</span>
            </span>
            <span className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-bell"></i>
              <span>Notifications</span>
            </span>
            <span className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-clipboard-list"></i>
              <span>Audit Logs</span>
            </span>
            <span className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
              <i className="fa-solid fa-gear"></i>
              <span>Settings</span>
            </span>
          </nav>
        </div>

        {/* Main Content */}
        <div id="main-content" className="flex-1 p-6">
          {/* Overview Header */}
          <div id="overview-header" className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Mission Control</h1>
            <p className="text-gray-600">Instant signal on stability, growth, and risk</p>
          </div>

          {/* Status Cards */}
          <div id="status-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-arrow-up text-green-600"></i>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">99.9%</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Uptime</h3>
              <p className="text-sm text-gray-600">24h: 100% • 7d: 99.9% • 30d: 99.8%</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-users text-blue-600"></i>
                </div>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">+12%</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Active Users</h3>
              <p className="text-sm text-gray-600">847 today • 142 tenants</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-chart-line text-purple-600"></i>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">+23</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">New Signups</h3>
              <p className="text-sm text-gray-600">Last 24h • 7 trials ending</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-database text-orange-600"></i>
                </div>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">78%</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Storage</h3>
              <p className="text-sm text-gray-600">2.3TB used • 3.0TB quota</p>
            </div>
          </div>

          {/* Charts Section */}
          <div id="charts-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Requests &amp; Errors</h3>
              <div id="requests-chart" className="h-64"></div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Queue Depth</h3>
              <div id="queue-chart" className="h-64"></div>
            </div>
          </div>

          {/* Alerts & Actions */}
          <div id="alerts-actions" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <i className="fa-solid fa-exclamation-triangle text-red-600"></i>
                    <div>
                      <p className="font-medium text-red-900">DNS Failure</p>
                      <p className="text-sm text-red-700">acme-corp.com verification failed</p>
                    </div>
                  </div>
                  <button className="text-red-600 hover:text-red-800">
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <i className="fa-solid fa-clock text-yellow-600"></i>
                    <div>
                      <p className="font-medium text-yellow-900">Rate Limit</p>
                      <p className="text-sm text-yellow-700">tenant-xyz exceeded API limits</p>
                    </div>
                  </div>
                  <button className="text-yellow-600 hover:text-yellow-800">
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg" onClick={onCreateTenant}>
                  <i className="fa-solid fa-plus"></i>
                  <span>Create Tenant</span>
                </button>
                <button className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg" onClick={onImpersonate}>
                  <i className="fa-solid fa-user-secret"></i>
                  <span>Impersonate</span>
                </button>
                <button className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg" onClick={onNotifyAdmins}>
                  <i className="fa-solid fa-bell"></i>
                  <span>Notify Admins</span>
                </button>
                <button className="flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg" onClick={onPurgeCache}>
                  <i className="fa-solid fa-trash"></i>
                  <span>Purge Cache</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


