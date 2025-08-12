import React, { useEffect, useState } from 'react';
import { getJSON } from '../../lib/api';

type Log = { id: string; actor_user_id: string; action: string; entity_type: string; entity_id: string | null; tenant_id: string | null; reason: string | null; created_at: string };

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const json = await getJSON('/api/audit?limit=200');
        setLogs((json as any).logs || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6 text-gray-600">Loading...</div>;

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Audit Logs</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{l.actor_user_id}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{l.action}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{l.entity_type}{l.entity_id ? `:${l.entity_id}` : ''}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{l.tenant_id || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{l.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


