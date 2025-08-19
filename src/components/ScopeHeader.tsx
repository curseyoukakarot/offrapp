import React from 'react';
import { useActiveTenant } from '../contexts/ActiveTenantContext';
import { useNavigate } from 'react-router-dom';

export const ScopeHeader: React.FC = () => {
  const { scope, activeTenantId, memberships, isSuperAdmin, setScope, setActiveTenantId } = useActiveTenant();
  const navigate = useNavigate();

  // Find current tenant info
  const currentTenant = memberships.find(m => m.tenant_id === activeTenantId);
  
  // Find super admin's own tenant (offr.app)
  const ownTenant = memberships.find(m => m.tenant_name?.toLowerCase().includes('offr'));

  if (!isSuperAdmin) return null;

  const switchToSuper = () => {
    setScope('super');
    setActiveTenantId(null);
    navigate('/super');
  };

  const switchToTenant = (tenantId: string) => {
    setScope('tenant');
    setActiveTenantId(tenantId);
    navigate(`/dashboard/admin?tenant_id=${tenantId}`);
  };

  const switchToMyTenant = () => {
    if (ownTenant) {
      switchToTenant(ownTenant.tenant_id);
    }
  };

  if (scope === 'super') {
    return (
      <div className="bg-purple-50 border-b border-purple-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-crown text-purple-600"></i>
              <span className="text-sm font-medium text-purple-800">Super Admin Portal</span>
            </div>
            <span className="text-purple-600">•</span>
            <span className="text-sm text-purple-700">Global view across all tenants</span>
          </div>
          <div className="flex items-center space-x-3">
            {ownTenant && (
              <button
                onClick={switchToMyTenant}
                className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
              >
                <i className="fa-solid fa-building mr-1"></i>
                My Tenant
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-building text-blue-600"></i>
            <span className="text-sm font-medium text-blue-800">
              Viewing: {currentTenant?.tenant_name || 'Unknown Tenant'}
            </span>
          </div>
          {memberships.length > 1 && (
            <>
              <span className="text-blue-600">•</span>
              <select
                value={activeTenantId || ''}
                onChange={(e) => switchToTenant(e.target.value)}
                className="text-sm border border-blue-300 rounded px-2 py-1 bg-white text-blue-800"
              >
                {memberships.map(m => (
                  <option key={m.tenant_id} value={m.tenant_id}>
                    {m.tenant_name} ({m.role})
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={switchToSuper}
            className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            <i className="fa-solid fa-crown mr-1"></i>
            Super Admin
          </button>
        </div>
      </div>
    </div>
  );
};
