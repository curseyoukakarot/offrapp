import React, { useEffect, useState } from 'react';

export default function ImpersonationBanner() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Poll lightweight endpoint by checking a HEAD to any metrics route and reading header
    const check = async () => {
      try {
        const res = await fetch('/api/metrics/uptime', { method: 'GET' });
        setActive(res.headers.get('x-impersonating') === 'true');
      } catch (_e) {
        setActive(false);
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  const stop = async () => {
    await fetch('/api/impersonate/stop', { method: 'POST' });
    setActive(false);
  };

  if (!active) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-white text-sm px-4 py-2 flex items-center justify-center gap-4">
      <span>Impersonation active</span>
      <button onClick={stop} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded">Stop</button>
    </div>
  );
}


