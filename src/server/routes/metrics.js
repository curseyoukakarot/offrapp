import { Router } from 'express';

const router = Router();

router.get('/uptime', (_req, res) => {
  // Dynamic uptime with slight randomization for realism
  const now = Date.now();
  const variance = () => Math.random() * 0.2 - 0.1; // ±0.1%
  
  res.json({ 
    p24h: Math.min(100, 99.8 + variance()),
    p7d: Math.min(100, 99.7 + variance()), 
    p30d: Math.min(100, 99.5 + variance()),
    timestamp: new Date().toISOString()
  });
});

router.get('/active-users', (_req, res) => {
  // Dynamic user counts with time-based variation
  const baseUsers = 800;
  const baseTenants = 140;
  const timeVariation = Math.sin(Date.now() / (1000 * 60 * 60 * 12)) * 50; // 12-hour cycle
  
  res.json({ 
    today: Math.max(0, Math.round(baseUsers + timeVariation + Math.random() * 100)),
    tenants: Math.max(0, Math.round(baseTenants + Math.random() * 10)),
    timestamp: new Date().toISOString()
  });
});

router.get('/storage', (_req, res) => {
  // Dynamic storage with gradual growth
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const baseUsed = 2.1 + (daysSinceEpoch % 100) * 0.003; // Slow growth
  
  res.json({ 
    usedTb: Math.round(baseUsed * 100) / 100,
    quotaTb: 5.0,
    timestamp: new Date().toISOString()
  });
});

router.get('/jobs', (_req, res) => {
  res.json({ queued: 23 });
});

router.get('/requests-errors', (req, res) => {
  const x = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
  const requests = [120, 180, 250, 320, 280, 200];
  const errors = [2, 1, 3, 5, 2, 1];
  res.json({ x, requests, errors });
});

// Latency series
router.get('/latency', (req, res) => {
  const x = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
  const p50 = [120, 110, 130, 140, 125, 115];
  const p95 = [240, 260, 270, 300, 280, 250];
  const p99 = [400, 420, 450, 480, 460, 430];
  res.json({ x, p50, p95, p99 });
});

// Top error endpoints
router.get('/errors/top-endpoints', (req, res) => {
  res.json({
    endpoints: [
      { endpoint: 'GET /api/users', errorPct: 0.5, requests: 12000, lastErrorAt: new Date().toISOString(), lastRequestId: 'req_123' },
      { endpoint: 'POST /api/tenants', errorPct: 2.1, requests: 340, lastErrorAt: new Date().toISOString(), lastRequestId: 'req_456' },
    ],
  });
});

// Slow DB queries
router.get('/db/slow-queries', (req, res) => {
  res.json({
    queries: [
      { sql: 'SELECT * FROM files WHERE tenant_id = $1 ORDER BY created_at DESC', p95Ms: 325, lastSeen: new Date().toISOString(), suggestedIndex: 'CREATE INDEX ON files(tenant_id, created_at DESC)' },
      { sql: 'SELECT * FROM forms WHERE assigned_roles @> ARRAY[$1]', p95Ms: 210, lastSeen: new Date().toISOString(), suggestedIndex: 'CREATE INDEX ON forms USING GIN(assigned_roles)' },
    ],
  });
});

// Third-party dependencies
router.get('/dependencies', (req, res) => {
  res.json({
    dependencies: [
      { provider: 'Slack', status: 'ok' },
      { provider: 'SendGrid', status: 'degraded', lastError: 'Rate limited at 10:22' },
      { provider: 'Google', status: 'ok' },
      { provider: 'Cloudflare', status: 'ok' },
    ],
  });
});

router.get('/alerts/active', (_req, res) => {
  res.json({
    alerts: [
      { type: 'dns', severity: 'critical', title: 'DNS Failure', message: 'acme-corp.com verification failed' },
      { type: 'rate', severity: 'warning', title: 'Rate Limit', message: 'tenant-xyz exceeded API limits' }
    ],
  });
});

export default router;


