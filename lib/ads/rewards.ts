export type AdTier = 'cpm' | 'cpc' | 'cpa' | 'premium_video' | 'offerwall'
export type UserTier = 'new' | 'active' | 'whale'

export const AD_DURATION_SECONDS = 30
export const AD_PLATFORM_SHARE = 0.4
export const AD_VIEWER_SHARE = 0.6
export const ADSTERRA_FALLBACK_CPM = 1.5

interface TierConfig {
  platformEarnsMin: number
  platformEarnsMax: number
  userPayoutMin: number
  userPayoutMax: number
  description: string
}

const REWARD_TIERS: Record<AdTier, TierConfig> = {
  cpm: {
    platformEarnsMin: 0.0003,
    platformEarnsMax: 0.001,
    userPayoutMin: 0.1,
    userPayoutMax: 0.5,
    description: 'Real-time CPM view payout',
  },
  cpc: {
    platformEarnsMin: 0.01,
    platformEarnsMax: 0.05,
    userPayoutMin: 0.5,
    userPayoutMax: 2,
    description: 'Click ads - user must interact',
  },
  cpa: {
    platformEarnsMin: 1.00,
    platformEarnsMax: 50.00,
    userPayoutMin: 10,
    userPayoutMax: 500,
    description: 'Offers - surveys, installs, signups',
  },
  premium_video: {
    platformEarnsMin: 0.01,
    platformEarnsMax: 0.05,
    userPayoutMin: 1,
    userPayoutMax: 5,
    description: 'High-CPM video ads',
  },
  offerwall: {
    platformEarnsMin: 0.50,
    platformEarnsMax: 20.00,
    userPayoutMin: 5,
    userPayoutMax: 200,
    description: 'Offer wall completions',
  },
}

export interface RewardResult {
  reward: number
  platformEarnings: number
  platformProfit: number
  userValue: number
  tier: AdTier
  userTier: UserTier
  isPremium: boolean
}

export function calculateAdReward({
  cpm,
  durationSeconds = AD_DURATION_SECONDS,
  viewerShare = AD_VIEWER_SHARE,
  platformShare = AD_PLATFORM_SHARE,
  premiumMultiplier = 1,
}: {
  cpm: number
  durationSeconds?: number
  viewerShare?: number
  platformShare?: number
  premiumMultiplier?: number
}) {
  const safeCpm = Number.isFinite(cpm) && cpm > 0 ? cpm : ADSTERRA_FALLBACK_CPM
  const safeDuration = Math.max(1, durationSeconds || AD_DURATION_SECONDS)
  const grossUsd = (safeCpm / 1000) * (safeDuration / 60)
  const viewerUsd = grossUsd * viewerShare
  const platformUsd = grossUsd * platformShare
  const viewerRewardSpy = Number((viewerUsd * 100 * premiumMultiplier).toFixed(2))
  const platformRewardSpy = Number((platformUsd * 100).toFixed(2))

  return {
    cpm: Number(safeCpm.toFixed(2)),
    grossUsd: Number(grossUsd.toFixed(6)),
    viewerUsd: Number(viewerUsd.toFixed(6)),
    platformUsd: Number(platformUsd.toFixed(6)),
    viewerRewardSpy,
    platformRewardSpy,
    viewerShare,
    platformShare,
    durationSeconds: safeDuration,
  }
}

export async function getUserTier(
  userId: string,
  supabase: any
): Promise<UserTier> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: stats } = await supabase
    .from('ad_watches')
    .select('reward_spy')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo)

  const monthlyEarnings = stats?.reduce(
    (sum: number, w: any) => sum + (w.reward_spy || 0),
    0
  ) || 0

  const monthlyUSD = monthlyEarnings * 0.01

  if (monthlyUSD > 50) return 'whale'
  if (monthlyUSD > 5) return 'active'
  return 'new'
}

export function calculateReward(
  adTier: AdTier,
  userTier: UserTier,
  isPremium: boolean,
  qualityScore: number = 1
): RewardResult {
  const config = REWARD_TIERS[adTier]
  const qualityMultiplier = Math.max(0.7, Math.min(1.5, 0.8 + qualityScore * 0.4))
  const premiumBoost = isPremium ? 1.15 : 1
  const tierMultipliers: Record<UserTier, number> = {
    new: 1.2,
    active: 1,
    whale: 0.8,
  }

  const base = calculateAdReward({
    cpm: 1.5,
    durationSeconds: AD_DURATION_SECONDS,
    premiumMultiplier: premiumBoost,
  })

  let finalReward = base.viewerRewardSpy * tierMultipliers[userTier] * qualityMultiplier * (config.userPayoutMax / 10)
  finalReward = Math.max(0.1, Number(finalReward.toFixed(2)))

  const platformEarnings = Number((base.platformRewardSpy * tierMultipliers[userTier] * qualityMultiplier).toFixed(2))
  const userValue = Number((finalReward / 100).toFixed(4))
  const platformProfit = Number((platformEarnings - userValue).toFixed(4))

  return {
    reward: finalReward,
    platformEarnings: Number(platformEarnings.toFixed(2)),
    platformProfit: Number(platformProfit.toFixed(2)),
    userValue,
    tier: adTier,
    userTier,
    isPremium,
  }
}

export function quickReward(
  adTier: AdTier,
  userTier: UserTier = 'new',
  isPremium: boolean = false
): number {
  const result = calculateReward(adTier, userTier, isPremium)
  return result.reward
}
