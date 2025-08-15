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

export async function vercelAddDomain(domain) {
  const { url } = vercelBase(`/v10/projects/{PROJECT_ID}/domains`);
  const res = await fetch(url, { method: 'POST', headers: vercelHeaders(), body: JSON.stringify({ name: domain }) });
  if (!res.ok && res.status !== 409) {
    const t = await res.text();
    throw new Error(`Vercel add domain failed: ${res.status} ${t}`);
  }
  return true;
}

export async function vercelGetDomain(domain) {
  const { url } = vercelBase(`/v9/projects/{PROJECT_ID}/domains/${encodeURIComponent(domain)}`);
  const res = await fetch(url, { headers: vercelHeaders() });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Vercel get domain failed: ${res.status} ${t}`);
  }
  return res.json();
}

export async function vercelRemoveDomain(domain) {
  const { url } = vercelBase(`/v9/projects/{PROJECT_ID}/domains/${encodeURIComponent(domain)}`);
  const res = await fetch(url, { method: 'DELETE', headers: vercelHeaders() });
  if (!res.ok && res.status !== 404) {
    const t = await res.text();
    throw new Error(`Vercel remove domain failed: ${res.status} ${t}`);
  }
  return true;
}


