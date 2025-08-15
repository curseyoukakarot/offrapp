import dns from 'dns';
const { resolveTxt } = dns.promises;

export async function resolveNestbaseTxt(domain) {
  const host = `_nestbase.${domain}`;
  try {
    const records = await resolveTxt(host);
    // records: string[][], flatten and join pieces
    return records.map(rr => rr.join(''));
  } catch (e) {
    if (e && (e.code === 'ENOTFOUND' || e.code === 'ENODATA')) return [];
    throw e;
  }
}


