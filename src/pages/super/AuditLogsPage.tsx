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
        // Fetch both audit logs and onboarding events
        const [auditJson, eventsJson] = await Promise.all([
          getJSON('/api/audit?limit=100'),
          fetch('/api/_debug/onboarding-events').then(r => r.json()).catch(() => ({ events: [] }))
        ]);
        
        const auditLogs = (auditJson as any).logs || [];
        const onboardingEvents = eventsJson.events || [];
        
        // Convert onboarding events to audit log format
        const convertedEvents = onboardingEvents.map((event: any) => ({
          id: event.id,
          actor_user_id: event.user_id || 'system',
          action: event.action,
          entity_type: 'onboarding',
          entity_id: event.invite_id,
          tenant_id: event.tenant_id,
          reason: event.error,
          created_at: event.timestamp,
          details: event.context
        }));
        
        // Combine and sort by timestamp
        const allLogs = [...auditLogs, ...convertedEvents]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 200);
        
        setLogs(allLogs);
      } finally {
        setLoading(false);
      }
    };
    load();
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
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
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                    <i className="fa-solid fa-clipboard-list text-4xl mb-4 text-gray-400"></i>
                    <p className="text-lg font-medium text-gray-600">No audit logs yet</p>
                    <p className="text-sm text-gray-500">System events will appear here</p>
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-2 text-sm text-gray-700">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{l.actor_user_id?.substring(0, 8) || 'system'}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        l.action.includes('failed') || l.action.includes('error') ? 'bg-red-100 text-red-800' :
                        l.action.includes('success') || l.action.includes('created') ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">{l.entity_type}{l.entity_id ? `:${l.entity_id.substring(0, 8)}` : ''}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{l.tenant_id?.substring(0, 8) || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700" title={l.reason}>
                      {l.reason ? (l.reason.length > 50 ? l.reason.substring(0, 50) + '...' : l.reason) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


