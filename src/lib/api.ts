// Tenant-aware fetch helpers
// Reads active tenant id from localStorage (same key used by useAuth)

const ACTIVE_TENANT_KEY = 'offrapp-active-tenant-id';

export function getActiveTenantId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_TENANT_KEY);
  } catch {
    return null;
  }
}

type FetchOptions = RequestInit & { json?: any };

export async function tenantFetch(path: string, options: FetchOptions = {}) {
  const tenantId = getActiveTenantId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (tenantId) headers['x-tenant-id'] = tenantId;

  const init: RequestInit = {
    ...options,
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  };

  const res = await fetch(path, init);
  const contentType = res.headers.get('content-type') || '';
  const parse = async () => (contentType.includes('application/json') ? res.json() : res.text());
  if (!res.ok) {
    const errBody = await parse();
    const err = new Error('Request failed');
    (err as any).status = res.status;
    (err as any).body = errBody;
    throw err;
  }
  return parse();
}

export const getJSON = (path: string, options: FetchOptions = {}) => tenantFetch(path, { ...options, method: 'GET' });
export const postJSON = (path: string, body?: any, options: FetchOptions = {}) => tenantFetch(path, { ...options, method: 'POST', json: body });
export const patchJSON = (path: string, body?: any, options: FetchOptions = {}) => tenantFetch(path, { ...options, method: 'PATCH', json: body });
export const delJSON = (path: string, options: FetchOptions = {}) => tenantFetch(path, { ...options, method: 'DELETE' });


