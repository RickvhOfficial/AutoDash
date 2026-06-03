import { describe, expect, test } from 'vitest'
import { completeLapTimeInput, formatLapTimeInput, msToLapTime } from '../utils/lapStorage'

describe('Lap Time Format Helpers', () => {
  test('formatLapTimeInput bouwt mm:ss.mmm uit cijfers', () => {
    expect(formatLapTimeInput('1234567')).toBe('12:34.567')
    expect(formatLapTimeInput('123456')).toBe('1:23.456')
    expect(formatLapTimeInput('')).toBe('')
  })

  test('completeLapTimeInput vult milliseconden aan', () => {
    expect(completeLapTimeInput('01:23')).toBe('01:23.000')
    expect(completeLapTimeInput('01:23.456')).toBe('01:23.456')
  })

  test('msToLapTime is inverse van milliseconden', () => {
    expect(msToLapTime(83456)).toBe('1:23.456')
    expect(msToLapTime(1)).toBe('0:00.001')
  })
})
