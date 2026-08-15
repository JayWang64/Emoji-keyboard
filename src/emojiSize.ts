/** Biggest an emoji is ever drawn, in pixels. */
export const MAX_EMOJI_SIZE = 44
/** Smallest we shrink to. Past this the strip scrolls instead. */
export const MIN_EMOJI_SIZE = 18
/** Space between emoji, in pixels. */
export const EMOJI_GAP = 4
/** Left plus right padding inside one emoji's box, in pixels. */
export const EMOJI_PADDING = 8
/** The strip is always this many rows tall, so its height never changes. */
export const STRIP_ROWS = 2
/** Padding inside the strip, per side, in pixels. Matches Composer.css. */
export const STRIP_PADDING = 4

/**
 * Usable width inside the strip. `clientWidth` counts the strip's own padding,
 * which is not space the emoji can use.
 */
export function usableWidth(clientWidth: number): number {
  return Math.max(0, clientWidth - STRIP_PADDING * 2)
}

/** Height of the strip's content area: always two rows at full size. */
export const STRIP_CONTENT_HEIGHT =
  STRIP_ROWS * (MAX_EMOJI_SIZE + EMOJI_PADDING) + (STRIP_ROWS - 1) * EMOJI_GAP

/**
 * How big to draw each emoji so that `count` of them fit inside two rows of a
 * strip `width` pixels wide. Shrinks as the strip fills, never past
 * MIN_EMOJI_SIZE, never above MAX_EMOJI_SIZE.
 *
 * A width of 0 means we have not measured the strip yet, so use full size.
 */
export function emojiSizeFor(count: number, width: number): number {
  if (count <= 0 || width <= 0) return MAX_EMOJI_SIZE

  const perRow = Math.ceil(count / STRIP_ROWS)
  const cell = (width - EMOJI_GAP * (perRow - 1)) / perRow
  const size = Math.floor(cell - EMOJI_PADDING)

  return Math.min(MAX_EMOJI_SIZE, Math.max(MIN_EMOJI_SIZE, size))
}

/** How many emoji fit in two rows at a given width before scrolling starts. */
export function capacityBeforeScrolling(width: number): number {
  if (width <= 0) return 0
  const cell = MIN_EMOJI_SIZE + EMOJI_PADDING
  const perRow = Math.floor((width + EMOJI_GAP) / (cell + EMOJI_GAP))
  return perRow * STRIP_ROWS
}
