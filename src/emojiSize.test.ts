import { describe, it, expect } from 'vitest'
import {
  MAX_EMOJI_SIZE,
  MIN_EMOJI_SIZE,
  STRIP_CONTENT_HEIGHT,
  capacityBeforeScrolling,
  emojiSizeFor,
  STRIP_PADDING,
  usableWidth,
} from './emojiSize'

// A narrow phone strip, roughly what a 430px screen leaves after padding.
const PHONE = 390

describe('emojiSizeFor', () => {
  it('uses full size for an empty strip', () => {
    expect(emojiSizeFor(0, PHONE)).toBe(MAX_EMOJI_SIZE)
  })

  it('uses full size before we have measured the strip', () => {
    expect(emojiSizeFor(10, 0)).toBe(MAX_EMOJI_SIZE)
  })

  it('keeps full size while there is room', () => {
    expect(emojiSizeFor(1, PHONE)).toBe(MAX_EMOJI_SIZE)
    expect(emojiSizeFor(8, PHONE)).toBe(MAX_EMOJI_SIZE)
  })

  it('shrinks once two rows at full size would not fit', () => {
    const roomy = emojiSizeFor(8, PHONE)
    const tight = emojiSizeFor(20, PHONE)
    expect(tight).toBeLessThan(roomy)
  })

  it('never grows back as more emoji are added', () => {
    let previous = emojiSizeFor(1, PHONE)
    for (let count = 2; count <= 60; count += 1) {
      const size = emojiSizeFor(count, PHONE)
      expect(size).toBeLessThanOrEqual(previous)
      previous = size
    }
  })

  it('never goes below the floor', () => {
    expect(emojiSizeFor(500, PHONE)).toBe(MIN_EMOJI_SIZE)
  })

  it('never goes above the ceiling on a wide screen', () => {
    expect(emojiSizeFor(2, 2000)).toBe(MAX_EMOJI_SIZE)
  })

  it('fits every count up to capacity inside two rows', () => {
    const capacity = capacityBeforeScrolling(PHONE)
    for (let count = 1; count <= capacity; count += 1) {
      const size = emojiSizeFor(count, PHONE)
      const perRow = Math.ceil(count / 2)
      const used = perRow * (size + 8) + (perRow - 1) * 4
      expect(used).toBeLessThanOrEqual(PHONE)
    }
  })

  it('gives a wider strip a bigger emoji for the same count', () => {
    expect(emojiSizeFor(20, 800)).toBeGreaterThan(emojiSizeFor(20, PHONE))
  })
})

describe('capacityBeforeScrolling', () => {
  it('holds at least two dozen on a phone', () => {
    expect(capacityBeforeScrolling(PHONE)).toBeGreaterThanOrEqual(24)
  })

  it('is zero before the strip is measured', () => {
    expect(capacityBeforeScrolling(0)).toBe(0)
  })
})

describe('STRIP_CONTENT_HEIGHT', () => {
  it('is two full-size rows tall', () => {
    expect(STRIP_CONTENT_HEIGHT).toBe(2 * (MAX_EMOJI_SIZE + 8) + 4)
  })
})

describe('usableWidth', () => {
  it('takes the strip padding off both sides', () => {
    expect(usableWidth(400)).toBe(400 - STRIP_PADDING * 2)
  })

  it('never goes negative', () => {
    expect(usableWidth(2)).toBe(0)
    expect(usableWidth(0)).toBe(0)
  })
})
