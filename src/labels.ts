import emojiData from 'emojibase-data/en/data.json'
import { normalize, stripTones } from './normalize'
import { overrides } from './overrides'

export type LabelMap = Map<string, string>

export { normalize, stripTones, overrides }

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
  const normalized = normalize(emoji)
  const bare = stripTones(normalized)

  // An override always wins. It is looked up on the normalized forms too, so
  // a key written with or without a variation selector both match.
  const override = overrides[emoji] ?? overrides[bare] ?? overrides[normalized]
  if (override) return override

  // Tone-stripped first: it yields "thumbs up" where the exact key would
  // yield "thumbs up: medium skin tone".
  return map.get(bare) ?? map.get(normalized) ?? 'symbol'
}

/** One spoken word per emoji, in tap order. */
export function buildWords(map: LabelMap, emojis: string[]): string[] {
  return emojis.map((emoji) => lookupLabel(map, emoji))
}
