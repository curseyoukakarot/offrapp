import React, { useEffect, useState } from 'react';
import { useAuth } from '../state/auth';

type Banner = { id?: string; title: string; message: string };

export default function SystemBanner() {
  const { activeTenant } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/notifications/active', {
          headers: activeTenant?.id ? { 'x-tenant-id': activeTenant.id } : {},
        });
        const json = await res.json();
        setBanners(json.banners || []);
      } catch (_e) {
        setBanners([]);
      }
    };
    load();
  }, [activeTenant?.id]);

  if (!banners.length) return null;
  return (
    <div className="w-full flex flex-col gap-2 px-4 py-2 bg-blue-50 border-b border-blue-100">
      {banners.map((b, idx) => (
        <div key={b.id || idx} className="text-sm text-blue-800">
          <strong>{b.title}: </strong>
          <span>{b.message}</span>
        </div>
      ))}
    </div>
  );
}


