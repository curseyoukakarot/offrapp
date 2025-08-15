export const EXTRA_ADMIN_SEAT_PRICE = 29;

export type PlanKey = 'starter' | 'pro' | 'advanced' | 'custom';

export const PLANS: Record<PlanKey, {
  price: number | null;
  maxClients: number | null;
  features: {
    embeds: boolean; forms: boolean; files: boolean;
    custom_domain: boolean; custom_email: boolean; slack: boolean;
    zapier?: boolean; make?: boolean; embedded_payments?: boolean;
  };
}> = {
  starter: {
    price: 49, maxClients: 30,
    features: { embeds: true, forms: true, files: true, custom_domain: false, custom_email: false, slack: false }
  },
  pro: {
    price: 99, maxClients: 150,
    features: { embeds: true, forms: true, files: true, custom_domain: true, custom_email: true, slack: true, embedded_payments: false }
  },
  advanced: {
    price: 199, maxClients: 1000,
    features: { embeds: true, forms: true, files: true, custom_domain: true, custom_email: true, slack: true, zapier: true, make: true, embedded_payments: true }
  },
  custom: { price: null, maxClients: null, features: { embeds: true, forms: true, files: true, custom_domain: true, custom_email: true, slack: true, zapier: true, make: true, embedded_payments: true } }
};

export function hasFeature(plan: PlanKey, key: keyof typeof PLANS['starter']['features']) {
  return !!PLANS[plan].features[key];
}


