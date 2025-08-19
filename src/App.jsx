import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ActiveTenantProvider } from './contexts/ActiveTenantContext';
import SuperAdminPage from './pages/super/SuperAdminPage';
import { SuperAdminRoute } from './components/auth/SuperAdminRoute';
import JobsPage from './pages/super/JobsPage.tsx';
import AuditLogsPage from './pages/super/AuditLogsPage.tsx';
import AdminEmbedsManagerV2 from './pages/AdminEmbedsManagerV2';
import RecruitProDashboard from './pages/RecruitProDashboard';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import Dashboard from './pages/Dashboard';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import UsersList from './pages/UsersList';
import FilesPage from './pages/FilesPage';
import AdminFilesManager from './pages/AdminFilesManager';
import AdminSettings from './pages/AdminSettings.jsx';
import FormsList from './pages/FormsList';
import FormBuilder from './pages/FormBuilder.tsx';
import FormRenderer from './pages/FormRenderer';
import FormResponses from './pages/FormResponses';
import FormAssignRoles from './pages/FormAssignRoles';
import UserFiles from './pages/UserFiles';
import EmbedPage from './pages/EmbedPage';
import CompleteProfile from './pages/CompleteProfile';
import Settings from './pages/Settings';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import AdminLayout from './layouts/AdminLayout';
import ClientLayout from './layouts/ClientLayout.jsx';
import TenantsDomainsPage from './pages/super/TenantsDomainsPage.tsx';
import AppHealthPage from './pages/super/AppHealthPage.tsx';
import IntegrationsPage from './pages/super/IntegrationsPage.tsx';
import NotificationsPage from './pages/super/NotificationsPage.tsx';
import SettingsPage from './pages/super/SettingsPage.tsx';
import UserManagementPage from './pages/super/UserManagementPage.tsx';
import Signup from './pages/Signup.jsx';
import Onboarding from './pages/Onboarding.jsx';
import HomePage from './pages/HomePage.jsx';

// Protected Route component that checks for both authentication and role
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { session, userRole, loading, isSuperAdmin } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  if (isSuperAdmin) {
    return typeof children === 'function' ? children(userRole) : children;
  }
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    switch (userRole) {
      case 'admin':
        return <Navigate to="/dashboard/admin" />;
      case 'recruitpro':
        return <Navigate to="/dashboard/recruitpro" />;
      case 'jobseeker':
        return <Navigate to="/dashboard/jobseeker" />;
      case 'client':
        return <Navigate to="/dashboard/client" />;
      default:
        return <Navigate to="/login" />;
    }
  }

  return typeof children === 'function' ? children(userRole) : children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ActiveTenantProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* Admin Routes */}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin-embeds" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminEmbedsManagerV2 />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <UsersList />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/assign-roles" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <FormAssignRoles />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/admin/settings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* RecruitPro Routes */}
          <Route path="/dashboard/recruitpro" element={
            <ProtectedRoute allowedRoles={['recruitpro']}>
              <ClientLayout>
                <RecruitProDashboard />
              </ClientLayout>
            </ProtectedRoute>
          } />

          {/* Job Seeker Routes */}
          <Route path="/dashboard/jobseeker" element={
            <ProtectedRoute allowedRoles={['jobseeker']}>
              <ClientLayout>
                <JobSeekerDashboard />
              </ClientLayout>
            </ProtectedRoute>
          } />

          {/* Client Routes */}
          <Route path="/dashboard/client" element={
            <ProtectedRoute allowedRoles={['client', 'role1', 'role2', 'role3']}>
              <ClientLayout>
                <ClientDashboard />
              </ClientLayout>
            </ProtectedRoute>
          } />

          {/* Shared Routes */}
          <Route path="/files" element={
            <ProtectedRoute allowedRoles={['admin', 'recruitpro', 'jobseeker', 'client', 'role1', 'role2', 'role3']}>
              <ClientLayout>
                <FilesPage />
              </ClientLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/files" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminFilesManager />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/forms" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <FormsList />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/forms/new" element={
            <ProtectedRoute allowedRoles={['admin', 'recruitpro']}>
              <AdminLayout>
                <FormBuilder />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/forms/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'recruitpro', 'jobseeker', 'client', 'role1', 'role2', 'role3']}>
              <ClientLayout>
                <FormRenderer />
              </ClientLayout>
            </ProtectedRoute>
          } />
          <Route path="/forms/:id/responses" element={
            <ProtectedRoute allowedRoles={['admin', 'recruitpro']}>
              <AdminLayout>
                <FormResponses />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/my-files" element={
            <ProtectedRoute allowedRoles={['admin', 'recruitpro', 'jobseeker', 'client', 'role1', 'role2', 'role3']}>
              <ClientLayout>
                <UserFiles />
              </ClientLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['recruitpro', 'jobseeker', 'client', 'role1', 'role2', 'role3']}>
              <ClientLayout>
                <Settings />
              </ClientLayout>
            </ProtectedRoute>
          } />
          {/* Embed Route */}
          <Route path="/embed/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'recruitpro', 'jobseeker', 'client', 'role1', 'role2', 'role3']}>
              <ClientLayout>
                <EmbedPage />
              </ClientLayout>
            </ProtectedRoute>
          } />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* Super Admin */}
          <Route
            path="/superadmin/user-management"
            element={
              <SuperAdminRoute>
                <SuperAdminLayout>
                  <UserManagementPage />
                </SuperAdminLayout>
              </SuperAdminRoute>
            }
          />

          <Route
            path="/super"
            element={
              <SuperAdminRoute>
                <SuperAdminLayout>
                  <SuperAdminPage />
                </SuperAdminLayout>
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super/jobs"
            element={
              <SuperAdminRoute>
                <SuperAdminLayout>
                  <JobsPage />
                </SuperAdminLayout>
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super/audit"
            element={
              <SuperAdminRoute>
                <SuperAdminLayout>
                  <AuditLogsPage />
                </SuperAdminLayout>
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super/tenants"
            element={
              <SuperAdminRoute>
                <SuperAdminLayout>
                  <TenantsDomainsPage />
                </SuperAdminLayout>
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super/health"
            element={
              <SuperAdminRoute>
                <SuperAdminLayout>
                  <AppHealthPage />
                </SuperAdminLayout>
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super/integrations"
            element={
              <SuperAdminRoute>
                <SuperAdminLayout>
                  <IntegrationsPage />
                </SuperAdminLayout>
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super/notifications"
            element={
              <SuperAdminRoute>
                <SuperAdminLayout>
                  <NotificationsPage />
                </SuperAdminLayout>
              </SuperAdminRoute>
            }
          />

          <Route
            path="/super/settings"
            element={
              <SuperAdminRoute>
                <SuperAdminLayout>
                  <SettingsPage />
                </SuperAdminLayout>
              </SuperAdminRoute>
            }
          />

          {/* Public Home Page */}
          <Route path="/" element={<HomePage />} />
          {/* Catch-all route for unknown paths */}
          <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </ActiveTenantProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
