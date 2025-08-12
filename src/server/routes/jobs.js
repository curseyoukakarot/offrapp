import { Router } from 'express';
import { logAudit } from '../utils/audit.js';

const router = Router();

router.get('/recent', (_req, res) => {
  const jobs = [
    { id: 'j1', queue: 'emails', status: 'completed', runtimeMs: 1234, attempts: 1, errorExcerpt: null, createdAt: new Date(Date.now() - 3600e3).toISOString() },
    { id: 'j2', queue: 'webhooks', status: 'failed', runtimeMs: 530, attempts: 3, errorExcerpt: 'Timeout', createdAt: new Date(Date.now() - 2*3600e3).toISOString() },
    { id: 'j3', queue: 'index', status: 'active', runtimeMs: 210, attempts: 0, errorExcerpt: null, createdAt: new Date().toISOString() },
  ];
  res.json({ jobs });
});

router.post('/:id/retry', async (req, res) => {
  await logAudit({ action: 'job.retry', entityType: 'job', entityId: req.params.id, reason: null, before: null, after: { status: 'queued' }, req });
  res.json({ ok: true, id: req.params.id, status: 'queued' });
});

router.post('/:id/cancel', async (req, res) => {
  await logAudit({ action: 'job.cancel', entityType: 'job', entityId: req.params.id, reason: null, before: null, after: { status: 'canceled' }, req });
  res.json({ ok: true, id: req.params.id, status: 'canceled' });
});

router.get('/cron', (_req, res) => {
  const cron = [
    { name: 'daily-sync', schedule: '0 3 * * *', lastRunAt: new Date(Date.now() - 86400e3).toISOString(), nextRunAt: new Date(Date.now() + 43200e3).toISOString(), enabled: true },
    { name: 'cleanup', schedule: '0 */6 * * *', lastRunAt: new Date(Date.now() - 7200e3).toISOString(), nextRunAt: new Date(Date.now() + 10800e3).toISOString(), enabled: true },
  ];
  res.json({ cron });
});

router.post('/cron/:name/toggle', async (req, res) => {
  const enabled = Math.random() > 0.5;
  await logAudit({ action: 'cron.toggle', entityType: 'cron', entityId: null, reason: null, before: null, after: { name: req.params.name, enabled }, req });
  res.json({ ok: true, name: req.params.name, enabled });
});

export default router;


