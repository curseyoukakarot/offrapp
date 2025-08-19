import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import type { Options as HighchartsOptions, SeriesOptionsType } from 'highcharts';
import { Link, useNavigate } from 'react-router-dom';
import NotifyAdminsModal from '../../components/modals/NotifyAdminsModal';
import ImpersonateUserModal from '../../components/modals/ImpersonateUserModal';
import { useActiveTenant } from '../../contexts/ActiveTenantContext';
import { supabase } from '../../supabaseClient';

export default function SuperAdminPage() {
  const navigate = useNavigate();
  const { setScope, setActiveTenantId } = useActiveTenant();
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [tenants, setTenants] = useState([]);
  useEffect(() => {
    const load = async () => {
      // Fetch metrics and tenants
      const [uptimeRes, usersRes, storageRes, jobsRes, reqErrRes, tenantsRes] = await Promise.all([
        fetch('/api/metrics/uptime'),
        fetch('/api/metrics/active-users'),
        fetch('/api/metrics/storage'),
        fetch('/api/metrics/jobs'),
        fetch('/api/metrics/requests-errors?window=24h'),
        (async () => {
          try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;
            const res = await fetch('/api/super/tenants', {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            return res.json();
          } catch {
            return { items: [] };
          }
        })(),
      ]);
      
      setTenants(tenantsRes.items || []);
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
  const [showImpersonate, setShowImpersonate] = useState(false);
  const onImpersonate = () => { setShowImpersonate(true); };
  const onPurgeCache = () => {};
  const onRebuildIndex = () => {};
  const onCreateTenant = () => {};
  const onNotifyAdmins = () => { setShowNotifyModal(true); };
  
  const viewAsTenant = (tenantId: string) => {
    setScope('tenant');
    setActiveTenantId(tenantId);
    navigate(`/dashboard/admin?tenant_id=${tenantId}`);
  };

  return (
    <div className="bg-gray-50">
      {/* Main Content only; header/sidebar now provided by SuperAdminLayout */}
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

          {/* Tenants Quick Access */}
          <div className="mt-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tenant Access</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenants.map(tenant => (
                  <div key={tenant.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{tenant.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tenant.tier === 'advanced' ? 'bg-purple-100 text-purple-800' :
                        tenant.tier === 'pro' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tenant.tier}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      {tenant.seats_used || 0} / {tenant.seats_total || 3} users
                    </div>
                    <button
                      onClick={() => viewAsTenant(tenant.id)}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      <i className="fa-solid fa-eye mr-2"></i>
                      View as Tenant
                    </button>
                  </div>
                ))}
              </div>
              {tenants.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <i className="fa-solid fa-building text-2xl mb-2"></i>
                  <p>No tenants found</p>
                </div>
              )}
            </div>
          </div>
      </div>
      <NotifyAdminsModal open={showNotifyModal} onClose={() => setShowNotifyModal(false)} />
      <ImpersonateUserModal open={showImpersonate} onClose={() => setShowImpersonate(false)} />
    </div>
  );
}


