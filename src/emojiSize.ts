/** Biggest an emoji is ever drawn, in pixels. */
export const MAX_EMOJI_SIZE = 44
/** Smallest we shrink to. Past this the strip scrolls instead. */
export const MIN_EMOJI_SIZE = 18
/** Space between emoji, in pixels. */
export const EMOJI_GAP = 4
/** Left plus right padding inside one emoji's box, in pixels. */
export const EMOJI_PADDING = 8
/** Padding inside the strip, per side, in pixels. Matches Composer.css. */
export const STRIP_PADDING = 4

/** Rows the phone layout reserves. The desktop column is measured instead. */
export const STRIP_ROWS = 2
/** Fixed height of the strip's content area on a phone. */
export const STRIP_CONTENT_HEIGHT =
  STRIP_ROWS * (MAX_EMOJI_SIZE + EMOJI_PADDING) + (STRIP_ROWS - 1) * EMOJI_GAP

/**
 * Usable space inside the strip. `clientWidth` and `clientHeight` count the
 * strip's own padding, which is not space the emoji can use.
 */
export function usableWidth(clientWidth: number): number {
  return Math.max(0, clientWidth - STRIP_PADDING * 2)
}

export function usableHeight(clientHeight: number): number {
  return Math.max(0, clientHeight - STRIP_PADDING * 2)
}

/** How many emoji of this size sit side by side in `width` pixels. */
export function perRowAt(size: number, width: number): number {
  return Math.max(1, Math.floor((width + EMOJI_GAP) / (size + EMOJI_PADDING + EMOJI_GAP)))
}

/** How many rows of this size fit in `height` pixels. */
export function rowsAt(size: number, height: number): number {
  return Math.max(1, Math.floor((height + EMOJI_GAP) / (size + EMOJI_GAP)))
}

/**
 * Biggest size at which `count` emoji all fit inside a box `width` by
 * `height`. Never above MAX_EMOJI_SIZE, never below MIN_EMOJI_SIZE; past that
 * floor the strip scrolls instead of shrinking further.
 *
 * A width or height of 0 means the strip has not been measured yet, so use
 * full size.
 */
export function emojiSizeFor(
  count: number,
  width: number,
  height: number,
): number {
  if (count <= 0 || width <= 0 || height <= 0) return MAX_EMOJI_SIZE

  for (let size = MAX_EMOJI_SIZE; size > MIN_EMOJI_SIZE; size -= 1) {
    const capacity = perRowAt(size, width) * rowsAt(size, height)
    if (count <= capacity) return size
  }
  return MIN_EMOJI_SIZE
}

/** How many emoji fit in the box before it starts scrolling. */
export function capacityBeforeScrolling(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 0
  return perRowAt(MIN_EMOJI_SIZE, width) * rowsAt(MIN_EMOJI_SIZE, height)
}
