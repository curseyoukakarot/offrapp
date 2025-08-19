export function PlanBadge({ plan }) {
  const p = String(plan || 'starter').toLowerCase();
  const klass = p === 'advanced' ? 'bg-indigo-100 text-indigo-700' : p === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
  return <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${klass}`}>{p.toUpperCase()}</span>;
}


