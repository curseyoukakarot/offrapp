export function vercelHeaders() {
  const token = process.env.VERCEL_TOKEN;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export function vercelBase(path) {
  const pid = process.env.VERCEL_PROJECT_ID;
  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : '';
  return { url: `https://api.vercel.com${path.replace('{PROJECT_ID}', pid)}${team}` };
}

async function doFetch(url, init, attempts = 0) {
  const res = await fetch(url, init);
  if (res.status === 429) {
    if (attempts >= 3) return { rateLimited: true, status: 429 };
    const wait = 400 + attempts * 200;
    await new Promise(r => setTimeout(r, wait));
    return doFetch(url, init, attempts + 1);
  }
  return res;
}

export async function vercelAddDomain(domain) {
  const { url } = vercelBase(`/v10/projects/{PROJECT_ID}/domains`);
  const res = await doFetch(url, { method: 'POST', headers: vercelHeaders(), body: JSON.stringify({ name: domain }) });
  if (res && res.rateLimited) return { rateLimited: true };
  if (!res.ok && res.status !== 409) {
    const t = await res.text();
    return { ok: false, status: res.status, text: t };
  }
  return { ok: true };
}

export async function vercelGetDomain(domain) {
  const { url } = vercelBase(`/v9/projects/{PROJECT_ID}/domains/${encodeURIComponent(domain)}`);
  const res = await doFetch(url, { headers: vercelHeaders() });
  if (res && res.rateLimited) return { rateLimited: true };
  if (!res.ok) {
    const t = await res.text();
    return { ok: false, status: res.status, text: t };
  }
  const json = await res.json();
  return { ok: true, json };
}

export async function vercelRemoveDomain(domain) {
  const { url } = vercelBase(`/v9/projects/{PROJECT_ID}/domains/${encodeURIComponent(domain)}`);
  const res = await doFetch(url, { method: 'DELETE', headers: vercelHeaders() });
  if (res && res.rateLimited) return { rateLimited: true };
  if (!res.ok && res.status !== 404) {
    const t = await res.text();
    return { ok: false, status: res.status, text: t };
  }
  return { ok: true };
}


