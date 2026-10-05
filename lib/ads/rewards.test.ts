import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateAdReward, AD_DURATION_SECONDS } from './rewards.ts'

test('ad reward uses a real CPM share split and a 30 second duration', () => {
  const result = calculateAdReward({ cpm: 2.5, durationSeconds: 30 })

  assert.equal(AD_DURATION_SECONDS, 30)
  assert.ok(result.viewerRewardSpy > 0)
  assert.equal(result.platformShare, 0.4)
  assert.equal(result.viewerShare, 0.6)
  assert.ok(result.viewerRewardSpy > result.platformRewardSpy)
  assert.ok(result.viewerRewardSpy < 5)
})
