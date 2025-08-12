import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function SuperAdminRoute({ children }: { children: React.ReactElement }) {
  const { user, userRole, isSuperAdmin, loading } = useAuth() as any;
  if (loading) return null;
  const hasSuper = isSuperAdmin || userRole === 'super_admin' || userRole === 'superadmin' || userRole === 'super-admin';
  if (!user || !hasSuper) return <Navigate to="/app" replace />;
  return children;
}


