import { Router } from 'express';

const router = Router();

router.get('/uptime', (_req, res) => {
  res.json({ p24h: 100, p7d: 99.9, p30d: 99.8 });
});

router.get('/active-users', (_req, res) => {
  res.json({ today: 847, tenants: 142 });
});

router.get('/storage', (_req, res) => {
  res.json({ usedTb: 2.3, quotaTb: 3.0 });
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

router.get('/alerts/active', (_req, res) => {
  res.json({
    alerts: [
      { type: 'dns', severity: 'critical', title: 'DNS Failure', message: 'acme-corp.com verification failed' },
      { type: 'rate', severity: 'warning', title: 'Rate Limit', message: 'tenant-xyz exceeded API limits' }
    ],
  });
});

export default router;


