import { describe, it, expect } from 'vitest'
import { buildLabelMap, lookupLabel } from './labels'
import { normalize } from './normalize'
import { overrides } from './overrides'

const map = buildLabelMap()
const entries = Object.entries(overrides)

describe('the override list', () => {
  it('covers a useful number of emoji', () => {
    expect(entries.length).toBeGreaterThan(60)
  })

  it('only lists emoji that actually exist', () => {
    const unknown = entries
      .map(([emoji]) => emoji)
      .filter((emoji) => !map.has(emoji))
    expect(unknown).toEqual([])
  })

  it('is keyed without variation selectors, so picker output matches', () => {
    const raw = entries.map(([emoji]) => emoji).filter((e) => e !== normalize(e))
    expect(raw).toEqual([])
  })

  it('never repeats the official word it is replacing', () => {
    const pointless = entries.filter(([emoji, word]) => map.get(emoji) === word)
    expect(pointless).toEqual([])
  })

  it('gives every emoji its own word', () => {
    // Several emoji all saying "happy" is worse than the labels this
    // replaces: it flattens the distinctions a child is choosing between.
    const seen = new Map<string, string[]>()
    for (const [emoji, word] of entries) {
      seen.set(word, [...(seen.get(word) ?? []), emoji])
    }
    const shared = [...seen.entries()].filter(([, list]) => list.length > 1)
    expect(shared).toEqual([])
  })

  it('has no empty words', () => {
    expect(entries.filter(([, word]) => !word.trim())).toEqual([])
  })
})

describe('overrides in use', () => {
  it('drops the trailing "face" from animals', () => {
    expect(lookupLabel(map, '🐶')).toBe('dog')
    expect(lookupLabel(map, '🐱')).toBe('cat')
    expect(lookupLabel(map, '🐷')).toBe('pig')
  })

  it('uses the everyday word for vehicles', () => {
    expect(lookupLabel(map, '🚗')).toBe('car')
    expect(lookupLabel(map, '🚂')).toBe('steam train')
  })

  it('says the feeling, not the description', () => {
    expect(lookupLabel(map, '😂')).toBe('laughing till it hurts')
    expect(lookupLabel(map, '😭')).toBe('sobbing')
    expect(lookupLabel(map, '🌧️')).toBe('rain')
  })

  it('keeps close feelings distinct rather than collapsing them', () => {
    const words = ['😀', '😃', '😄', '😁', '😊'].map((e) => lookupLabel(map, e))
    expect(new Set(words).size).toBe(words.length)
  })

  it('matches with or without the variation selector', () => {
    expect(lookupLabel(map, '☔️')).toBe('umbrella')
    expect(lookupLabel(map, '☔')).toBe('umbrella')
  })

  it('leaves the already-good words alone', () => {
    expect(lookupLabel(map, '🍕')).toBe('pizza')
    expect(lookupLabel(map, '🐘')).toBe('elephant')
    expect(lookupLabel(map, '🌈')).toBe('rainbow')
    expect(lookupLabel(map, '🎂')).toBe('birthday cake')
  })

  it('still falls back to symbol for nonsense', () => {
    expect(lookupLabel(map, 'abc')).toBe('symbol')
  })
})
