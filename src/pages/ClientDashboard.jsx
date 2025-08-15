import React, { useEffect, useState } from 'react';
import AssignedFormsViewer from '../components/AssignedFormsViewer';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function ClientDashboard({ variant }) {
  const [activeTab, setActiveTab] = useState('files');
  const { userRole } = useAuth();
  const [embeds, setEmbeds] = useState([]);
  const [loadingEmbeds, setLoadingEmbeds] = useState(true);

  const tabBtn = (key, label, icon) => (
    <button
      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
        activeTab === key
          ? 'bg-white text-gray-900 shadow'
          : 'text-gray-600 hover:text-gray-900'
      }`}
      data-tab={key}
      onClick={() => setActiveTab(key)}
    >
      <i className={`fa-solid ${icon} mr-2`}></i>
      {label}
    </button>
  );

  useEffect(() => {
    const loadEmbeds = async () => {
      try {
        setLoadingEmbeds(true);
        const tenantId = localStorage.getItem('offrapp-active-tenant-id') || '';
        const res = await fetch('/api/embeds', { headers: { ...(tenantId ? { 'x-tenant-id': tenantId } : {}) } });
        const json = await res.json();
        const all = Array.isArray(json.embeds) ? json.embeds : [];
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        const visible = all
          .filter(e => (
            (e.embed_type === 'role' && e.role === userRole && e.is_active) ||
            (e.embed_type === 'user' && e.user_id === userId && e.is_active)
          ))
          .sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setEmbeds(visible);
      } catch (_e) {
        setEmbeds([]);
      } finally {
        setLoadingEmbeds(false);
      }
    };
    loadEmbeds();
  }, [userRole]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Content only; header/sidebar provided by ClientLayout */}
      <div id="main-content" className="lg:ml-64 min-h-screen">
        {/* Welcome Banner */}
        <div id="welcome-banner" className="p-6">
          <div className={`bg-gradient-to-r ${variant === 'recruitpro' ? 'from-purple-600 to-purple-700' : variant === 'jobseeker' ? 'from-green-600 to-green-700' : 'from-blue-600 to-blue-700'} rounded-2xl p-8 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <DynamicGreeting />
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
          <AssignedFormsViewer />
        </div>

        {/* Pages Tab */}
        <div id="pages-tab" className={`tab-content px-6 ${activeTab === 'pages' ? '' : 'hidden'}`}>
          {loadingEmbeds ? (
            <div className="text-sm text-gray-500">Loading pages…</div>
          ) : embeds.length === 0 ? (
            <div className="text-sm text-gray-500">No pages assigned yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {embeds.map((e) => (
                <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-hover">
                  <div className={`h-40 bg-gradient-to-br ${e.provider === 'calendly' ? 'from-blue-500 to-blue-600' : e.provider === 'monday' ? 'from-purple-500 to-purple-600' : 'from-gray-700 to-gray-800'} flex items-center justify-center`}>
                    {e.provider === 'calendly' && <i className="fa-solid fa-calendar text-white text-4xl"></i>}
                    {e.provider === 'monday' && <i className="fa-solid fa-tasks text-white text-4xl"></i>}
                    {e.provider === 'notion' && <i className="fa-solid fa-n text-white text-4xl"></i>}
                    {e.provider === 'custom' && <i className="fa-solid fa-link text-white text-4xl"></i>}
                  </div>
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-2">{e.title}</h4>
                    <p className="text-sm text-gray-500 mb-4 capitalize">{e.provider}</p>
                    <Link to={`/embed/${e.id}`} className="w-full inline-block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                      Open Tool
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DynamicGreeting() {
  const [name, setName] = useState('');
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return setName('');
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', uid)
        .maybeSingle();
      const first = (profile?.first_name || '').trim();
      const last = (profile?.last_name || '').trim();
      setName([first, last].filter(Boolean).join(' '));
    };
    load();
  }, []);
  return (
    <h2 className="text-3xl font-bold mb-2">{name ? `Welcome back, ${name}!` : 'Welcome back!'}</h2>
  );
}


