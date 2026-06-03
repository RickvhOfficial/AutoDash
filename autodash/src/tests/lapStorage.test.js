import { describe, expect, test } from 'vitest'
import { isValidLapTime, lapTimeToMs } from '../utils/lapStorage'

describe('Lap Time Utilities', () => {
  test('valideert correct tijdformaat', () => {
    expect(isValidLapTime('01:23.456')).toBe(true)
    expect(isValidLapTime('abc')).toBe(false)
    expect(isValidLapTime('1:2.3')).toBe(false)
    expect(isValidLapTime(null)).toBe(false)
    expect(isValidLapTime('  01:23.456  ')).toBe(true)
  })

  test('converteert rondetijd naar milliseconden', () => {
    expect(lapTimeToMs('01:23.456')).toBe(83456)
    expect(lapTimeToMs('00:00.001')).toBe(1)
    expect(lapTimeToMs('12:34.567')).toBe(754567)
  })
})
