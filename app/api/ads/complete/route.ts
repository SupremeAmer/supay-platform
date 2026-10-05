import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AD_DURATION_SECONDS, calculateAdReward } from '@/lib/ads/rewards'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { adTier, platform, fraudSignals, cpm } = body

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('spy_balance, earned_spy, daily_ad_watch_count, last_ad_watch_at, is_premium')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, message: 'User profile not found' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]
    const lastWatchDate = profile.last_ad_watch_at ? new Date(profile.last_ad_watch_at).toISOString().split('T')[0] : null
    let dailyCount = profile.daily_ad_watch_count || 0
    if (lastWatchDate !== today) dailyCount = 0

    const dailyLimit = adTier === 'video' ? 10 : 20
    if (dailyCount >= dailyLimit) {
      return NextResponse.json({ success: false, message: 'Daily ad limit reached. Come back tomorrow!' }, { status: 429 })
    }

    const realCpm = Number(cpm || 1.5)
    const rewardInfo = calculateAdReward({
      cpm: realCpm,
      durationSeconds: AD_DURATION_SECONDS,
      premiumMultiplier: profile.is_premium ? 1.15 : 1,
    })

    if (!Number.isFinite(rewardInfo.viewerRewardSpy) || rewardInfo.viewerRewardSpy <= 0) {
      return NextResponse.json({ success: false, message: 'Ads are not available right now.' }, { status: 503 })
    }

    const reward = Number(rewardInfo.viewerRewardSpy.toFixed(2))

    const { error: insertError } = await supabase.from('ad_watches').insert({
      user_id: user.id,
      reward_spy: reward,
      duration_seconds: AD_DURATION_SECONDS,
      platform_used: platform || 'adsterra',
      ad_tier: adTier || 'display',
      fraud_score: fraudSignals?.fraudScore || 0,
      verified: true,
    })

    if (insertError) {
      return NextResponse.json({ success: false, message: `Failed to record ad watch: ${insertError.message}` }, { status: 500 })
    }

    const newBalance = Number(((profile.spy_balance || 0) + reward).toFixed(2))
    const newEarned = Number(((profile.earned_spy || 0) + reward).toFixed(2))

    await supabase
      .from('profiles')
      .update({
        spy_balance: newBalance,
        earned_spy: newEarned,
        daily_ad_watch_count: dailyCount + 1,
        last_ad_watch_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    const { data: breakdown } = await supabase
      .from('user_spy_breakdown')
      .select('earned_spy')
      .eq('user_id', user.id)
      .maybeSingle()

    if (breakdown) {
      await supabase
        .from('user_spy_breakdown')
        .update({ earned_spy: Number(((breakdown.earned_spy || 0) + reward).toFixed(2)) })
        .eq('user_id', user.id)
    } else {
      await supabase.from('user_spy_breakdown').insert({
        user_id: user.id,
        earned_spy: reward,
        deposited_spy: 0,
        referral_spy: 0,
        staking_rewards_spy: 0,
      })
    }

    try {
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'ad_watch',
        amount_spy: reward,
        balance_before: profile.spy_balance || 0,
        balance_after: newBalance,
        metadata: { ad_tier: adTier, platform: platform },
      })
    } catch {}

    return NextResponse.json({ success: true, reward: reward.toFixed(2) })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Internal server error' }, { status: 500 })
  }
}
