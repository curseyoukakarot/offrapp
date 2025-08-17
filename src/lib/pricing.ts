export type BillingCycle = 'monthly' | 'annual'

export const PRICE_IDS = {
  starter: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_STARTER_MONTHLY,
    annual: import.meta.env.VITE_STRIPE_PRICE_STARTER_ANNUAL,
  },
  pro: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY,
    annual: import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL,
  },
  advanced: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_ADVANCED_MONTHLY,
    annual: import.meta.env.VITE_STRIPE_PRICE_ADVANCED_ANNUAL,
  },
} as const

export const ANNUAL_EQUIVALENT_MONTHLY = {
  starter: 33,
  pro: 83,
  advanced: 166,
} as const

export function getPriceId(tier: keyof typeof PRICE_IDS, cycle: BillingCycle): string | undefined {
  return PRICE_IDS[tier]?.[cycle]
}


