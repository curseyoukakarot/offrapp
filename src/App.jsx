import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminEmbedsManager from './pages/AdminEmbedsManager';
import RecruitProDashboard from './pages/RecruitProDashboard';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UsersList from './pages/UsersList';
import FilesPage from './pages/FilesPage';
import FormsList from './pages/FormsList';
import FormBuilder from './pages/FormBuilder';
import FormRenderer from './pages/FormRenderer';
import FormResponses from './pages/FormResponses';
import FormAssignRoles from './pages/FormAssignRoles';
import UserFiles from './pages/UserFiles';
import EmbedPage from './pages/EmbedPage';
import CompleteProfile from './pages/CompleteProfile';
import { SessionProvider } from './components/SessionProvider';

// Protected Route component that checks for both authentication and role
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { session, userRole, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" />;
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
    <AuthProvider>
      <Router>
        <SessionProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route path="/dashboard/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin-embeds" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminEmbedsManager />
              </ProtectedRoute>
            } />
            <Route path="/crm/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UsersList />
              </ProtectedRoute>
            } />
            <Route path="/assign-roles" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <FormAssignRoles />
              </ProtectedRoute>
            } />

            {/* RecruitPro Routes */}
            <Route path="/dashboard/recruitpro" element={
              <ProtectedRoute allowedRoles={['recruitpro']}>
                <RecruitProDashboard />
              </ProtectedRoute>
            } />

            {/* Job Seeker Routes */}
            <Route path="/dashboard/jobseeker" element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <JobSeekerDashboard />
              </ProtectedRoute>
            } />

            {/* Shared Routes */}
            <Route path="/files" element={
              <ProtectedRoute allowedRoles={['admin', 'recruitpro', 'jobseeker', 'client']}>
                <FilesPage />
              </ProtectedRoute>
            } />
            <Route path="/forms" element={
              <ProtectedRoute allowedRoles={['admin', 'recruitpro', 'jobseeker', 'client']}>
                <FormsList />
              </ProtectedRoute>
            } />
            <Route path="/forms/new" element={
              <ProtectedRoute allowedRoles={['admin', 'recruitpro']}>
                <FormBuilder />
              </ProtectedRoute>
            } />
            <Route path="/forms/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'recruitpro', 'jobseeker', 'client']}>
                <FormRenderer />
              </ProtectedRoute>
            } />
            <Route path="/forms/:id/responses" element={
              <ProtectedRoute allowedRoles={['admin', 'recruitpro']}>
                <FormResponses />
              </ProtectedRoute>
            } />
            <Route path="/my-files" element={
              <ProtectedRoute allowedRoles={['admin', 'recruitpro', 'jobseeker', 'client']}>
                <UserFiles />
              </ProtectedRoute>
            } />
            {/* Embed Route */}
            <Route path="/embed/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'recruitpro', 'jobseeker', 'client']}>
                <EmbedPage />
              </ProtectedRoute>
            } />
            <Route path="/complete-profile" element={<CompleteProfile />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" />} />
            {/* Catch-all route for unknown paths */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </SessionProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
