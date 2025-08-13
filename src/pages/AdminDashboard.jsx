import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  useEffect(() => {
    // Counter animation
    function animateCounter(element) {
      const targetAttr = element.getAttribute('data-count') || '0';
      const target = parseInt(String(targetAttr).replace(/,/g, ''), 10) || 0;
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
      }, 16);
    }
    const counters = document.querySelectorAll('.counter');
    counters.forEach((counter) => {
      setTimeout(() => animateCounter(counter), Math.random() * 500);
    });
  }, []);

  return (
    <div className="bg-bg">
      {/* Header */}
      <header id="header" className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="text-xl font-semibold text-text">Offr Admin</span>
            </div>
            <div className="text-gray text-sm">Dashboard • December 15, 2024</div>
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
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside id="sidebar" className="w-64 bg-white border-r border-gray-200 h-screen sticky top-16">
          <nav className="p-4 space-y-2">
            <Link to="/dashboard/admin" className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary/10 border-r-2 border-primary text-primary cursor-pointer">
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
                <Link to="/forms/new" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray hover:bg-gray-50 transition-colors cursor-pointer">
                  <i className="fa-solid fa-clipboard-list"></i>
                  <span>Forms</span>
                </Link>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main id="main-content" className="flex-1 p-6">
          {/* Stats Overview */}
          <section id="stats-section" className="mb-8 fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-card rounded-xl p-6 shadow-sm hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray text-sm font-medium">Total Clients</p>
                    <p className="text-3xl font-bold text-text counter" data-count="1,247">0</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-users text-primary"></i>
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-green-600 flex items-center">
                    <i className="fa-solid fa-arrow-up mr-1"></i>
                    12%
                  </span>
                  <span className="text-gray ml-2">vs last month</span>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-sm hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray text-sm font-medium">Active Clients</p>
                    <p className="text-3xl font-bold text-text counter" data-count="892">0</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-user-check text-green-600"></i>
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-green-600 flex items-center">
                    <i className="fa-solid fa-arrow-up mr-1"></i>
                    8%
                  </span>
                  <span className="text-gray ml-2">vs last month</span>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-sm hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray text-sm font-medium">Total Forms</p>
                    <p className="text-3xl font-bold text-text counter" data-count="156">0</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-clipboard-list text-purple-600"></i>
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-green-600 flex items-center">
                    <i className="fa-solid fa-arrow-up mr-1"></i>
                    24%
                  </span>
                  <span className="text-gray ml-2">vs last month</span>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-sm hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray text-sm font-medium">Files Uploaded</p>
                    <p className="text-3xl font-bold text-text counter" data-count="2,431">0</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-cloud-upload text-orange-600"></i>
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-green-600 flex items-center">
                    <i className="fa-solid fa-arrow-up mr-1"></i>
                    16%
                  </span>
                  <span className="text-gray ml-2">vs last month</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Upload Section */}
            <section id="file-upload-section" className="bg-card rounded-xl p-6 shadow-sm hover-lift fade-in">
              <h3 className="text-lg font-semibold text-text mb-4">Upload Files</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray mb-2">Assign to User</label>
                <select className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary">
                  <option>Select a user...</option>
                  <option>John Doe</option>
                  <option>Jane Smith</option>
                  <option>Mike Johnson</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                <i className="fa-solid fa-cloud-upload text-4xl text-gray mb-4"></i>
                <p className="text-text font-medium mb-2">Drop files here or click to upload</p>
                <p className="text-gray text-sm">Supports: PDF, DOC, XLS, JPG, PNG (Max 10MB)</p>
                <button className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Choose Files
                </button>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray mb-3">Recent Uploads</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <i className="fa-solid fa-file-pdf text-red-500"></i>
                      <span className="text-sm text-text">document.pdf</span>
                    </div>
                    <span className="text-xs text-gray">2 min ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <i className="fa-solid fa-file-excel text-green-500"></i>
                      <span className="text-sm text-text">spreadsheet.xlsx</span>
                    </div>
                    <span className="text-xs text-gray">5 min ago</span>
                  </div>
                </div>
              </div>
            </section>

            {/* User Management Preview */}
            <section id="user-management-preview" className="bg-card rounded-xl p-6 shadow-sm hover-lift fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text">Recent Users</h3>
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                  <i className="fa-solid fa-plus mr-2"></i>Add User
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" className="w-10 h-10 rounded-full" alt="User 1" />
                    <div>
                      <p className="text-sm font-medium text-text">Sarah Wilson</p>
                      <p className="text-xs text-gray">sarah@company.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                    <button className="text-gray hover:text-text">
                      <i className="fa-solid fa-ellipsis-h"></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" className="w-10 h-10 rounded-full" alt="User 2" />
                    <div>
                      <p className="text-sm font-medium text-text">David Chen</p>
                      <p className="text-xs text-gray">david@company.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>
                    <button className="text-gray hover:text-text">
                      <i className="fa-solid fa-ellipsis-h"></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg" className="w-10 h-10 rounded-full" alt="User 3" />
                    <div>
                      <p className="text-sm font-medium text-text">Alex Rodriguez</p>
                      <p className="text-xs text-gray">alex@company.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                    <button className="text-gray hover:text-text">
                      <i className="fa-solid fa-ellipsis-h"></i>
                    </button>
                  </div>
                </div>
              </div>

              <Link to="/crm/users" className="w-full mt-4 py-2 text-primary hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium text-center block">
                View All Users
              </Link>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}


