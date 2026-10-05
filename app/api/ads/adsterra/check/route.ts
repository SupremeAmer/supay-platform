import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { adTier } = body
    const apiKey = process.env.ADSTERRA_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        available: false,
        ecpm: 0,
        inventory: 0,
        message: 'Ad inventory unavailable',
        adTier: adTier || 'video',
      }, { status: 503 })
    }

    try {
      const response = await fetch('https://api3.adsterratools.com/publisher/stats.json', {
        headers: {
          'X-API-Key': apiKey,
        },
      })

      const data = await response.json().catch(() => ({}))
      const inventory = Number(data?.inventory || 0)
      const ecpm = Number(data?.ecpm || 0)
      const available = response.ok && inventory > 0 && ecpm > 0

      return NextResponse.json({
        available,
        ecpm: available ? ecpm : 0,
        inventory,
        message: available ? 'Ads available' : 'No ad inventory available',
        adTier: adTier || 'video',
      }, { status: available ? 200 : 503 })
    } catch {
      return NextResponse.json({
        available: false,
        ecpm: 0,
        inventory: 0,
        message: 'Ads unavailable right now',
        adTier: adTier || 'video',
      }, { status: 503 })
    }
  } catch {
    return NextResponse.json({
      available: false,
      ecpm: 0,
      inventory: 0,
      message: 'Ads unavailable right now',
    }, { status: 503 })
  }
}
