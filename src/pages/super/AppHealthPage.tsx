import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import type { Options as HighchartsOptions, SeriesOptionsType } from 'highcharts';
import { getJSON } from '../../lib/api';

type Uptime = { p24h: number; p7d: number; p30d: number };
type ReqErr = { x: string[]; requests: number[]; errors: number[] };
type Latency = { x: string[]; p50: number[]; p95: number[]; p99: number[] };
type EndpointStat = { endpoint: string; errorPct: number; requests: number; lastErrorAt: string; lastRequestId: string };
type SlowQuery = { sql: string; p95Ms: number; lastSeen: string; suggestedIndex: string };
type Dependency = { provider: string; status: 'ok' | 'degraded' | 'down'; lastError?: string };

export default function AppHealthPage() {
  const [uptime, setUptime] = useState<Uptime>({ p24h: 0, p7d: 0, p30d: 0 });
  const [reqErr, setReqErr] = useState<ReqErr>({ x: [], requests: [], errors: [] });
  const [latency, setLatency] = useState<Latency>({ x: [], p50: [], p95: [], p99: [] });
  const [endpoints, setEndpoints] = useState<EndpointStat[]>([]);
  const [queries, setQueries] = useState<SlowQuery[]>([]);
  const [deps, setDeps] = useState<Dependency[]>([]);
  const [trace, setTrace] = useState<EndpointStat | null>(null);

  useEffect(() => {
    const load = async () => {
      const [u, re, lt, es, sq, dp] = await Promise.all([
        getJSON('/api/metrics/uptime') as Promise<Uptime>,
        getJSON('/api/metrics/requests-errors?window=24h') as Promise<ReqErr>,
        getJSON('/api/metrics/latency?window=24h') as Promise<Latency>,
        getJSON('/api/metrics/errors/top-endpoints?window=24h') as Promise<{ endpoints: EndpointStat[] }>,
        getJSON('/api/metrics/db/slow-queries?window=24h') as Promise<{ queries: SlowQuery[] }>,
        getJSON('/api/metrics/dependencies') as Promise<{ dependencies: Dependency[] }>,
      ]);
      setUptime(u);
      setReqErr(re);
      setLatency(lt);
      setEndpoints(es.endpoints || []);
      setQueries(sq.queries || []);
      setDeps(dp.dependencies || []);

      const reqEl = document.getElementById('health-requests-chart');
      if (reqEl) {
        const options: HighchartsOptions = {
          chart: { type: 'spline', backgroundColor: 'transparent' },
          title: { text: undefined },
          xAxis: { categories: re.x },
          yAxis: [{ title: { text: 'Requests/min' } }, { title: { text: 'Errors' }, opposite: true }],
          series: [
            { type: 'spline', name: 'Requests', data: re.requests, color: '#3B82F6' },
            { type: 'spline', name: 'Errors', data: re.errors, color: '#EF4444', yAxis: 1 },
          ] as SeriesOptionsType[],
          legend: { enabled: false },
          credits: { enabled: false },
        };
        (Highcharts as any).chart(reqEl as HTMLElement, options);
      }

      const latEl = document.getElementById('health-latency-chart');
      if (latEl) {
        const options: HighchartsOptions = {
          chart: { type: 'spline', backgroundColor: 'transparent' },
          title: { text: undefined },
          xAxis: { categories: lt.x },
          yAxis: { title: { text: 'Latency (ms)' } },
          series: [
            { type: 'spline', name: 'p50', data: lt.p50, color: '#60A5FA' },
            { type: 'spline', name: 'p95', data: lt.p95, color: '#8B5CF6' },
            { type: 'spline', name: 'p99', data: lt.p99, color: '#F59E0B' },
          ] as SeriesOptionsType[],
          legend: { enabled: true },
          credits: { enabled: false },
        };
        (Highcharts as any).chart(latEl as HTMLElement, options);
      }
    };
    load();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">App Health</h1>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-arrow-up text-green-600"></i>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">24h {uptime.p24h}%</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">7d {uptime.p7d}%</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">30d {uptime.p30d}%</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">API Uptime</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-gauge text-blue-600"></i>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">p50 {latency.p50.at(-1) ?? 0}ms</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">p95 {latency.p95.at(-1) ?? 0}ms</span>
              <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded">p99 {latency.p99.at(-1) ?? 0}ms</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">API Latency</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-bug text-red-600"></i>
            </div>
            <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">1h {reqErr.errors.at(-1) ?? 0}</div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Error Rate</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-key text-emerald-600"></i>
            </div>
            <div className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">OAuth OK</div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Auth Success</h3>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Requests &amp; Errors</h3>
          <div id="health-requests-chart" className="h-64"></div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Latency</h3>
          <div id="health-latency-chart" className="h-64"></div>
        </div>
      </div>

      {/* Endpoint Error Explorer */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Endpoint Error Explorer</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error %</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Error</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {endpoints.map((e) => (
                <tr key={e.endpoint}>
                  <td className="px-4 py-2 text-sm text-gray-900">{e.endpoint}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{e.errorPct.toFixed(2)}%</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{e.requests.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{new Date(e.lastErrorAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-right">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-lg" onClick={() => setTrace(e)}>Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slow Queries */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Slow Queries</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SQL</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">p95 (ms)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Seen</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Suggested Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {queries.map((q, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-sm text-gray-900 truncate max-w-[420px]">{q.sql}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{q.p95Ms}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{new Date(q.lastSeen).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{q.suggestedIndex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Third-Party Dependencies */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Third-Party Dependencies</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deps.map((d) => (
            <div key={d.provider} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <i className="fa-solid fa-plug text-gray-600"></i>
                <div>
                  <div className="font-medium text-gray-900">{d.provider}</div>
                  {d.lastError && <div className="text-sm text-gray-500">{d.lastError}</div>}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.status === 'ok' ? 'bg-green-100 text-green-800' : d.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{d.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trace Drawer */}
      {trace && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setTrace(null)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-[520px] bg-white shadow-xl border-l border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Trace Details</h3>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setTrace(null)}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Endpoint:</span> <span className="text-gray-900">{trace.endpoint}</span></div>
              <div><span className="text-gray-500">Request ID:</span> <span className="text-gray-900">{trace.lastRequestId}</span></div>
              <div><span className="text-gray-500">Tenant:</span> <span className="text-gray-900">acme-corp</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="text-gray-900">500</span></div>
              <div className="mt-3">
                <div className="text-gray-500 mb-1">Payload (excerpt)</div>
                <pre className="bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto text-xs">{`{"id":"${trace.lastRequestId}","ok":false,"error":"Example error"}`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


