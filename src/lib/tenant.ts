const LRU_CAPACITY = 5000;
const LRU_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { value: string | null; expiresAt: number }>();

function cacheGet(key: string): string | null | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expiresAt < Date.now()) { cache.delete(key); return undefined; }
  // refresh recency
  cache.delete(key); cache.set(key, hit);
  return hit.value;
}

function cacheSet(key: string, value: string | null) {
  if (cache.size >= LRU_CAPACITY) {
    // delete oldest (first inserted)
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, { value, expiresAt: Date.now() + LRU_TTL_MS });
}

export async function getTenantIdByHost(host: string): Promise<string | null> {
  const normalized = String(host || '').toLowerCase();
  const cached = cacheGet(normalized);
  if (cached !== undefined) return cached;

  // subdomain under nestbase.io (legacy .app still supported for backwards compat)
  if (/\.nestbase\.(io|app)$/.test(normalized)) {
    const left = normalized.split('.')[0];
    if (!['www', 'offr', 'nestbase'].includes(left)) {
      const t = await findTenantIdBySubdomain(left);
      cacheSet(normalized, t || null);
      return t || null;
    }
  }

  // custom domain lookup via tenant_domains
  const t2 = await findTenantIdByDomain(normalized);
  cacheSet(normalized, t2 || null);
  return t2 || null;
}

export async function resolveTenant(req: Request): Promise<string | null> {
  const url = new URL(req.url);
  const qp = url.searchParams.get('tenant');
  if (qp) return qp;

  const hdr = req.headers.get('x-tenant-id');
  if (hdr) return hdr;

  const host = req.headers.get('host') ?? '';
  if (host) {
    const fromHost = await getTenantIdByHost(host);
    if (fromHost) return fromHost;
  }

  const session = await getSession(req);
  if ((session as any)?.activeMembership?.tenant_id) return (session as any).activeMembership.tenant_id;
  return null;
}

// Placeholder signatures to implement using existing project utils
export async function getSession(_req: Request): Promise<any> { /* reuse existing */ return null; }
export async function findTenantIdBySubdomain(_sub: string): Promise<string | null> { /* db lookup */ return null; }
export async function findTenantIdByDomain(_host: string): Promise<string | null> { /* db lookup */ return null; }

export function safe<T extends (...a: any) => Promise<Response>>(fn: T) {
  return async (...a: Parameters<T>) => {
    try {
      return await fn(...a);
    } catch (e: any) {
      console.error('API error:', e);
      return new Response(JSON.stringify({ error: e?.message ?? 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  };
}


