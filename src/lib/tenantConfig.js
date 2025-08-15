import { useEffect, useState } from 'react';

export function useTenantConfig() {
  const [config, setConfig] = useState({ role_labels: {}, role_colors: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const tenantId = localStorage.getItem('offrapp-active-tenant-id') || '';
        const res = await fetch('/api/tenant-config', { headers: { ...(tenantId ? { 'x-tenant-id': tenantId } : {}) } });
        const json = await res.json();
        setConfig({ role_labels: json?.role_labels || {}, role_colors: json?.role_colors || {}, name: json?.name || '' });
      } catch {
        setConfig({ role_labels: {}, role_colors: {} });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const roleLabel = (code) => {
    const map = config.role_labels || {};
    const fallback = { admin: 'Admin', recruitpro: 'RecruitPro', jobseeker: 'Job Seeker', client: 'Client' };
    return map[code] || fallback[code] || code || '—';
  };

  return { config, roleLabel, loading };
}


