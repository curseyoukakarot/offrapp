export function Money({ cents, currency = 'USD' }) {
  const amount = (Number(cents || 0) / 100);
  return <span>{amount.toLocaleString(undefined, { style: 'currency', currency })}</span>;
}


