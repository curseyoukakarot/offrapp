import React, { useEffect, useState } from 'react';

type Job = {
  id: string;
  queue: string;
  status: string;
  runtimeMs: number;
  attempts: number;
  errorExcerpt: string | null;
  createdAt: string;
};

type Cron = { name: string; schedule: string; lastRunAt: string; nextRunAt: string; enabled: boolean };

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cron, setCron] = useState<Cron[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [jr, cr] = await Promise.all([
        fetch('/api/jobs/recent').then((r) => r.json()),
        fetch('/api/jobs/cron').then((r) => r.json()),
      ]);
      setJobs(jr.jobs || []);
      setCron(cr.cron || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const retry = async (id: string) => {
    await fetch(`/api/jobs/${id}/retry`, { method: 'POST' });
    load();
  };

  const cancel = async (id: string) => {
    await fetch(`/api/jobs/${id}/cancel`, { method: 'POST' });
    load();
  };

  const toggleCron = async (name: string) => {
    await fetch(`/api/jobs/cron/${name}/toggle`, { method: 'POST' });
    load();
  };

  if (loading) return <div className="p-6 text-gray-600">Loading...</div>;

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Queues &amp; Jobs</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Jobs</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Queue</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Runtime</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">{j.id}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{j.queue}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      j.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : j.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>{j.status}</span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{j.runtimeMs} ms</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{j.attempts}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{j.errorExcerpt || '-'}</td>
                  <td className="px-4 py-2 text-sm text-right space-x-2">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-lg" onClick={() => retry(j.id)}>Retry</button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg" onClick={() => cancel(j.id)}>Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Cron</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Run</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Next Run</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Enabled</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cron.map((c) => (
                <tr key={c.name}>
                  <td className="px-4 py-2 text-sm text-gray-900">{c.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{c.schedule}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{new Date(c.lastRunAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{new Date(c.nextRunAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm">{c.enabled ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2 text-sm text-right">
                    <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg" onClick={() => toggleCron(c.name)}>Toggle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


