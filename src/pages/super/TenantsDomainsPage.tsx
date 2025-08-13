import React, { useState } from 'react';

export default function TenantsDomainsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'domains' | 'branding' | 'usage'>('domains');

  const openDomainDrawer = () => setDrawerOpen(true);
  const closeDomainDrawer = () => setDrawerOpen(false);
  const openCreateTenantModal = () => setCreateOpen(true);
  const closeCreateTenantModal = () => setCreateOpen(false);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div id="main-container" className="min-h-screen">
        <div id="header" className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              <i className="fa-solid fa-building mr-3 text-blue-600"></i>
              Tenants &amp; Domains
            </h1>
            <button id="create-tenant-btn" onClick={openCreateTenantModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <i className="fa-solid fa-plus mr-2"></i>
              Create Tenant
            </button>
          </div>
        </div>

        <div id="content" className="p-6 space-y-6">
          <div id="filters-card" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input type="text" placeholder="Search tenants..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <select className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>All Plans</option>
                <option>Free</option>
                <option>Pro</option>
                <option>Business</option>
                <option>Enterprise</option>
              </select>
              <select className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>All Status</option>
                <option>Active</option>
                <option>Suspended</option>
              </select>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Has Custom Domain</span>
              </label>
            </div>
          </div>

          <div id="main-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div id="tenants-table" className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Tenants</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subdomain</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custom Domain</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">Acme Corp</div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">acme-corp</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Pro</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">24</td>
                        <td className="px-6 py-4 text-sm text-gray-500">2 hours ago</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900">acme-corp.nestbase.io</span>
                            <button className="text-gray-400 hover:text-gray-600" onClick={() => navigator.clipboard.writeText('acme-corp.nestbase.io')}>
                              <i className="fa-solid fa-copy text-xs"></i>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">app.acme.com</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <i className="fa-solid fa-shield-check mr-1"></i>Secured
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Open Admin</button>
                            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Impersonate</button>
                            <button className="text-gray-400 hover:text-gray-600" onClick={openDomainDrawer}>
                              <i className="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">TechStart Inc</div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">techstart</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Business</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">8</td>
                        <td className="px-6 py-4 text-sm text-gray-500">1 day ago</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900">techstart.nestbase.io</span>
                            <button className="text-gray-400 hover:text-gray-600" onClick={() => navigator.clipboard.writeText('techstart.nestbase.io')}>
                              <i className="fa-solid fa-copy text-xs"></i>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">—</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">No Custom Domain</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Open Admin</button>
                            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Impersonate</button>
                            <button className="text-gray-400 hover:text-gray-600">
                              <i className="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm text-gray-500">Showing 1-2 of 2 tenants</span>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 bg-gray-50">Previous</button>
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-500 bg-gray-50">Next</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Drawer */}
      <div id="domain-drawer" className={`fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 z-50 ${drawerOpen ? '' : 'translate-x-full hidden'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Domain Management</h3>
              <button onClick={closeDomainDrawer} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="mt-4 flex space-x-1">
              <button className={`tab-btn px-3 py-2 text-sm font-medium rounded-lg ${activeTab === 'domains' ? 'bg-blue-100 text-blue-700' : ''}`} onClick={() => setActiveTab('domains')}>Domains</button>
              <button className={`tab-btn px-3 py-2 text-sm font-medium rounded-lg ${activeTab === 'branding' ? 'bg-blue-100 text-blue-700' : ''}`} onClick={() => setActiveTab('branding')}>Branding</button>
              <button className={`tab-btn px-3 py-2 text-sm font-medium rounded-lg ${activeTab === 'usage' ? 'bg-blue-100 text-blue-700' : ''}`} onClick={() => setActiveTab('usage')}>Usage</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Domains Tab */}
            <div id="domains-tab" className={`tab-content ${activeTab === 'domains' ? '' : 'hidden'}`}>
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Auto Subdomain</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">acme-corp.nestbase.io</span>
                    <div className="flex space-x-2">
                      <button className="text-gray-400 hover:text-gray-600" onClick={() => navigator.clipboard.writeText('acme-corp.nestbase.io')}>
                        <i className="fa-solid fa-copy"></i>
                      </button>
                      <button className="text-blue-600 hover:text-blue-800">
                        <i className="fa-solid fa-external-link"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Custom Domains</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">app.acme.com</div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                          <i className="fa-solid fa-shield-check mr-1"></i>Secured
                        </span>
                      </div>
                      <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Add Custom Domain</h4>
                  <div className="space-y-3">
                    <input type="text" placeholder="example.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                      Add Domain
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Branding Tab */}
            <div id="branding-tab" className={`tab-content ${activeTab === 'branding' ? '' : 'hidden'}`}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <i className="fa-solid fa-cloud-upload text-2xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-500">Upload logo</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                    <input type="color" defaultValue="#3B82F6" className="w-full h-10 border border-gray-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                    <input type="color" defaultValue="#6B7280" className="w-full h-10 border border-gray-200 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Tab */}
            <div id="usage-tab" className={`tab-content ${activeTab === 'usage' ? '' : 'hidden'}`}>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Storage Used</span>
                  <span className="text-sm font-medium text-gray-900">2.4 GB / 10 GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">API Calls</span>
                  <span className="text-sm font-medium text-gray-900">15,432 / 50,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Seats</span>
                  <span className="text-sm font-medium text-gray-900">24 / 50</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Webhooks</span>
                  <span className="text-sm font-medium text-gray-900">8 / 25</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Tenant Modal */}
      {createOpen && (
        <div id="create-tenant-modal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Tenant</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
                <input type="text" placeholder="Acme Corporation" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input type="text" placeholder="acme-corp" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Free</option>
                  <option>Pro</option>
                  <option>Business</option>
                  <option>Enterprise</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeCreateTenantModal} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">Create Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


