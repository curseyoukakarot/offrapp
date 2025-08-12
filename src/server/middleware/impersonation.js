// Simple in-memory impersonation map keyed by real user id
// For production, swap to Redis.
const activeImpersonations = new Map();

export function startImpersonation(realUserId, targetUserId, reason) {
  activeImpersonations.set(realUserId, { targetUserId, reason, startedAt: new Date().toISOString() });
}

export function stopImpersonation(realUserId) {
  activeImpersonations.delete(realUserId);
}

export function getImpersonation(realUserId) {
  return activeImpersonations.get(realUserId) || null;
}

export function impersonationMiddleware(req, res, next) {
  const realUser = req.authedUser;
  if (!realUser) return next();
  const imp = getImpersonation(realUser.id);
  if (imp) {
    req.impersonating = true;
    req.impersonatedUserId = imp.targetUserId;
    res.setHeader('x-impersonating', 'true');
  }
  next();
}


