import emojiData from 'emojibase-data/en/data.json'

export type LabelMap = Map<string, string>

/**
 * Kid-friendly words that beat the official emojibase label.
 * Intentionally empty for now. Add entries like { '🐶': 'doggy' } later.
 */
export const overrides: Record<string, string> = {}

const VARIATION_SELECTORS = /[\u{FE0E}\u{FE0F}]/gu
const SKIN_TONES = /[\u{1F3FB}-\u{1F3FF}]/gu

export function normalize(input: string): string {
  return input.replace(VARIATION_SELECTORS, '')
}

export function stripTones(input: string): string {
  return input.replace(SKIN_TONES, '')
}

type RawEmoji = {
  label: string
  emoji?: string
  text?: string
  skins?: RawEmoji[]
}

function indexEntry(map: LabelMap, entry: RawEmoji): void {
  if (entry.emoji) map.set(normalize(entry.emoji), entry.label)
  if (entry.text) map.set(normalize(entry.text), entry.label)
  for (const skin of entry.skins ?? []) indexEntry(map, skin)
}

export function buildLabelMap(): LabelMap {
  const map: LabelMap = new Map()
  for (const entry of emojiData as RawEmoji[]) indexEntry(map, entry)
  return map
}

export function lookupLabel(map: LabelMap, emoji: string): string {
  const override = overrides[emoji]
  if (override) return override

  const normalized = normalize(emoji)
  // Tone-stripped first: it yields "thumbs up" where the exact key would
  // yield "thumbs up: medium skin tone".
  return map.get(stripTones(normalized)) ?? map.get(normalized) ?? 'symbol'
}

export function buildSentence(map: LabelMap, emojis: string[]): string {
  return emojis.map((emoji) => lookupLabel(map, emoji)).join(', ')
}
