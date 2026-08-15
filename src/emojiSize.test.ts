import { describe, it, expect } from 'vitest'
import {
  EMOJI_GAP,
  EMOJI_PADDING,
  MAX_EMOJI_SIZE,
  MIN_EMOJI_SIZE,
  STRIP_CONTENT_HEIGHT,
  STRIP_PADDING,
  capacityBeforeScrolling,
  emojiSizeFor,
  perRowAt,
  rowsAt,
  usableHeight,
  usableWidth,
} from './emojiSize'

// A narrow phone strip: two rows, roughly what a 430px screen leaves.
const PHONE_W = 390
const PHONE_H = STRIP_CONTENT_HEIGHT

// A desktop left column: narrower, but very tall.
const DESK_W = 460
const DESK_H = 620

/** Does `count` emoji at `size` actually fit the box? */
function fits(count: number, size: number, width: number, height: number) {
  const perRow = perRowAt(size, width)
  const rows = Math.ceil(count / perRow)
  return rows * (size + EMOJI_GAP) - EMOJI_GAP <= height
}

describe('emojiSizeFor', () => {
  it('uses full size for an empty strip', () => {
    expect(emojiSizeFor(0, PHONE_W, PHONE_H)).toBe(MAX_EMOJI_SIZE)
  })

  it('uses full size before the strip has been measured', () => {
    expect(emojiSizeFor(10, 0, PHONE_H)).toBe(MAX_EMOJI_SIZE)
    expect(emojiSizeFor(10, PHONE_W, 0)).toBe(MAX_EMOJI_SIZE)
  })

  it('keeps full size while there is room', () => {
    expect(emojiSizeFor(1, PHONE_W, PHONE_H)).toBe(MAX_EMOJI_SIZE)
    expect(emojiSizeFor(8, PHONE_W, PHONE_H)).toBe(MAX_EMOJI_SIZE)
  })

  it('shrinks once the box is full', () => {
    expect(emojiSizeFor(30, PHONE_W, PHONE_H)).toBeLessThan(MAX_EMOJI_SIZE)
  })

  it('never grows back as more emoji are added', () => {
    let previous = emojiSizeFor(1, PHONE_W, PHONE_H)
    for (let count = 2; count <= 120; count += 1) {
      const size = emojiSizeFor(count, PHONE_W, PHONE_H)
      expect(size).toBeLessThanOrEqual(previous)
      previous = size
    }
  })

  it('never goes below the floor or above the ceiling', () => {
    expect(emojiSizeFor(5000, PHONE_W, PHONE_H)).toBe(MIN_EMOJI_SIZE)
    expect(emojiSizeFor(2, 2000, 2000)).toBe(MAX_EMOJI_SIZE)
  })

  it('really does fit every count up to capacity, on a phone', () => {
    const capacity = capacityBeforeScrolling(PHONE_W, PHONE_H)
    for (let count = 1; count <= capacity; count += 1) {
      expect(fits(count, emojiSizeFor(count, PHONE_W, PHONE_H), PHONE_W, PHONE_H)).toBe(true)
    }
  })

  it('really does fit every count up to capacity, in a tall column', () => {
    const capacity = capacityBeforeScrolling(DESK_W, DESK_H)
    for (let count = 1; count <= capacity; count += 1) {
      expect(fits(count, emojiSizeFor(count, DESK_W, DESK_H), DESK_W, DESK_H)).toBe(true)
    }
  })

  it('keeps emoji bigger for longer in a tall column than on a phone', () => {
    expect(emojiSizeFor(40, DESK_W, DESK_H)).toBeGreaterThan(
      emojiSizeFor(40, PHONE_W, PHONE_H),
    )
  })
})

describe('perRowAt and rowsAt', () => {
  it('fits one emoji per row in a very narrow strip', () => {
    expect(perRowAt(MAX_EMOJI_SIZE, 10)).toBe(1)
  })

  it('fits one row in a very short strip', () => {
    expect(rowsAt(MAX_EMOJI_SIZE, 10)).toBe(1)
  })

  it('counts the gaps between emoji, not after the last one', () => {
    const size = 20
    const width = 3 * (size + EMOJI_PADDING) + 2 * EMOJI_GAP
    expect(perRowAt(size, width)).toBe(3)
    expect(perRowAt(size, width - 1)).toBe(2)
  })
})

describe('capacityBeforeScrolling', () => {
  it('holds a good long row on a phone', () => {
    expect(capacityBeforeScrolling(PHONE_W, PHONE_H)).toBeGreaterThanOrEqual(24)
  })

  it('holds far more in a tall desktop column', () => {
    expect(capacityBeforeScrolling(DESK_W, DESK_H)).toBeGreaterThan(
      capacityBeforeScrolling(PHONE_W, PHONE_H),
    )
  })

  it('is zero before the strip is measured', () => {
    expect(capacityBeforeScrolling(0, PHONE_H)).toBe(0)
    expect(capacityBeforeScrolling(PHONE_W, 0)).toBe(0)
  })
})

describe('usable space', () => {
  it('takes the strip padding off both sides', () => {
    expect(usableWidth(400)).toBe(400 - STRIP_PADDING * 2)
    expect(usableHeight(400)).toBe(400 - STRIP_PADDING * 2)
  })

  it('never goes negative', () => {
    expect(usableWidth(2)).toBe(0)
    expect(usableHeight(0)).toBe(0)
  })
})

describe('STRIP_CONTENT_HEIGHT', () => {
  it('is two full-size rows tall', () => {
    expect(STRIP_CONTENT_HEIGHT).toBe(
      2 * (MAX_EMOJI_SIZE + EMOJI_PADDING) + EMOJI_GAP,
    )
  })
})
