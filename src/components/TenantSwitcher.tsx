import React from 'react';
import { useAuth } from '../state/auth';

export default function TenantSwitcher() {
  const { memberships, activeTenant, setActiveTenant, loading } = useAuth();

  if (loading) return null;
  if (!memberships || memberships.length <= 1) return null;

  // Render a simple select based on activeTenant; names may be undefined until fetched
  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setActiveTenant({ id });
  };

  return (
    <div className="inline-block">
      <select
        className="border rounded px-2 py-1 text-sm"
        value={activeTenant?.id || ''}
        onChange={onChange}
      >
        {memberships.map((m) => (
          <option key={m.tenant_id} value={m.tenant_id}>
            {m.tenant_id}
          </option>
        ))}
      </select>
    </div>
  );
}


