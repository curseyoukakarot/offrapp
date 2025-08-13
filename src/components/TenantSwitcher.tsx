import React, { useEffect, useState } from 'react';
import { useAuth } from '../state/auth';
import { getJSON } from '../lib/api';

export default function TenantSwitcher() {
  const { memberships, activeTenant, setActiveTenant, loading } = useAuth();

  if (loading) return null;
  if (!memberships || memberships.length <= 1) return null;

  const [idToInfo, setIdToInfo] = useState<Record<string, { name?: string; slug?: string }>>({});

  useEffect(() => {
    // If memberships already contain name/slug, use them; else fetch minimal info
    const missing = memberships.filter((m: any) => !m.tenant_name && !m.tenant_slug).map((m: any) => m.tenant_id);
    const preset: Record<string, { name?: string; slug?: string }> = {};
    memberships.forEach((m: any) => {
      if (m.tenant_id) preset[m.tenant_id] = { name: m.tenant_name, slug: m.tenant_slug };
    });
    setIdToInfo((prev) => ({ ...prev, ...preset }));
    if (missing.length > 0) {
      Promise.all(missing.map((id: string) => getJSON(`/api/tenants/${id}`)))
        .then((results: any[]) => {
          const map: Record<string, { name?: string; slug?: string }> = {};
          results.forEach((r: any) => {
            if (r && r.tenant) map[r.tenant.id] = { name: r.tenant.name, slug: r.tenant.slug };
          });
          setIdToInfo((prev) => ({ ...prev, ...map }));
        })
        .catch(() => {});
    }
  }, [memberships]);

  // Render a simple select based on activeTenant, with nice labels
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
        {memberships.map((m: any) => {
          const info = idToInfo[m.tenant_id] || {};
          const label = info.name || info.slug ? `${info.name || info.slug}${info.slug ? ` (${info.slug})` : ''}` : m.tenant_id;
          return (
            <option key={m.tenant_id} value={m.tenant_id}>{label}</option>
          );
        })}
      </select>
    </div>
  );
}


