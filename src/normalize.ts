const VARIATION_SELECTORS = /[\u{FE0E}\u{FE0F}]/gu
const SKIN_TONES = /[\u{1F3FB}-\u{1F3FF}]/gu

/**
 * Strips the invisible variation selectors. Required, not cosmetic:
 * emojibase stores thumbs up as U+1F44D U+FE0F while a picker emits bare
 * U+1F44D, so unnormalized keys miss.
 */
export function normalize(input: string): string {
  return input.replace(VARIATION_SELECTORS, '')
}

/** Removes the skin-tone modifiers. */
export function stripTones(input: string): string {
  return input.replace(SKIN_TONES, '')
}
