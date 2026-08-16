import { describe, it, expect } from 'vitest'
import {
  buildLabelMap,
  buildWords,
  lookupLabel,
  normalize,
  overrides,
  stripTones,
} from './labels'

const map = buildLabelMap()

describe('normalize', () => {
  it('strips the emoji variation selector', () => {
    expect(normalize('❤️')).toBe('❤')
  })

  it('strips the text variation selector', () => {
    expect(normalize('❤︎')).toBe('❤')
  })

  it('leaves a plain emoji alone', () => {
    expect(normalize('🐶')).toBe('🐶')
  })
})

describe('stripTones', () => {
  it('removes a skin tone modifier', () => {
    expect(stripTones('👍🏽')).toBe('👍')
  })

  it('leaves an untoned emoji alone', () => {
    expect(stripTones('👍')).toBe('👍')
  })
})

describe('buildLabelMap', () => {
  it('indexes a large number of emoji', () => {
    expect(map.size).toBeGreaterThan(3000)
  })
})

describe('lookupLabel', () => {
  it('resolves a plain emoji', () => {
    expect(lookupLabel(map, '🦎')).toBe('lizard')
  })

  it('resolves an emoji that carries a variation selector', () => {
    expect(lookupLabel(map, '❤️')).toBe('red heart')
  })

  it('resolves the same emoji without its variation selector', () => {
    expect(lookupLabel(map, '❤')).toBe('red heart')
  })

  it('resolves an emoji the data stores with a variation selector', () => {
    expect(lookupLabel(map, '👍')).toBe('thumbs up')
  })

  it('drops the skin tone qualifier from the spoken word', () => {
    expect(lookupLabel(map, '👍🏽')).toBe('thumbs up')
    expect(lookupLabel(map, '👋🏿')).toBe('waving hand')
  })

  it('resolves multi-part sequences', () => {
    expect(lookupLabel(map, '👨‍👩‍👧')).toBe('family: man, woman, girl')
    expect(lookupLabel(map, '🏳️‍🌈')).toBe('rainbow flag')
  })

  it('falls back to symbol for unknown input', () => {
    expect(lookupLabel(map, 'abc')).toBe('symbol')
    expect(lookupLabel(map, '')).toBe('symbol')
  })

  it('lets an override win over the emojibase label', () => {
    overrides['🦎'] = 'lizzy'
    try {
      expect(lookupLabel(map, '🦎')).toBe('lizzy')
    } finally {
      delete overrides['🦎']
    }
  })
})

describe('buildWords', () => {
  it('returns one word per emoji, in tap order', () => {
    expect(buildWords(map, ['🐶', '🍎', '😀'])).toEqual([
      'dog',
      'red apple',
      'grinning',
    ])
  })

  it('returns an empty list for no emoji', () => {
    expect(buildWords(map, [])).toEqual([])
  })

  it('handles a single emoji', () => {
    expect(buildWords(map, ['🥔'])).toEqual(['potato'])
  })
})
