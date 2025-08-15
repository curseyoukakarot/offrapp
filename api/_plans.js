export const PLANS = {
  starter: { features: { custom_domain: false } },
  pro: { features: { custom_domain: true } },
  advanced: { features: { custom_domain: true } },
  custom: { features: { custom_domain: true } },
};

export function hasFeature(plan, key) {
  const p = PLANS[String(plan || 'starter')] || PLANS.starter;
  return !!(p.features && p.features[key]);
}


