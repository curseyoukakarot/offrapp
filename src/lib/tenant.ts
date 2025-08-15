export async function resolveTenant(req: Request): Promise<string | null> {
  const url = new URL(req.url);
  const qp = url.searchParams.get('tenant');
  if (qp) return qp;

  const hdr = req.headers.get('x-tenant-id');
  if (hdr) return hdr;

  const host = req.headers.get('host') ?? '';
  const sub = host.split('.')?.[0];
  if (sub && !['www', 'offr', 'nestbase'].includes(sub)) {
    const t = await findTenantIdBySubdomain(sub);
    if (t) return t;
  }

  const session = await getSession(req);
  if ((session as any)?.activeMembership?.tenant_id) return (session as any).activeMembership.tenant_id;

  return null;
}

// Placeholder signatures to implement using existing project utils
export async function getSession(_req: Request): Promise<any> { /* reuse existing */ return null; }
export async function findTenantIdBySubdomain(_sub: string): Promise<string | null> { /* db lookup */ return null; }

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


