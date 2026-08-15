import { useEffect, useRef, useState } from 'react'
import { emojiSizeFor, usableHeight, usableWidth } from './emojiSize'
import './Composer.css'

/** Tracks the strip's box, so emoji can be sized to fill it. */
function useMeasuredBox<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const measure = () =>
      setBox((current) =>
        current.width === node.clientWidth && current.height === node.clientHeight
          ? current
          : { width: node.clientWidth, height: node.clientHeight },
      )
    measure()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }

    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, box }
}

export type ComposerProps = {
  emojis: string[]
  canSpeak: boolean
  /** Position currently being read aloud, or null when silent. */
  speakingIndex: number | null
  onPlay: () => void
  onStop: () => void
  onBackspace: () => void
  onClear: () => void
}

export default function Composer({
  emojis,
  canSpeak,
  speakingIndex,
  onPlay,
  onStop,
  onBackspace,
  onClear,
}: ComposerProps) {
  const isEmpty = emojis.length === 0
  const isSpeaking = speakingIndex !== null
  const done = isSpeaking ? speakingIndex + 1 : 0
  const percent = isEmpty ? 0 : (done / emojis.length) * 100

  const { ref: stripRef, box } = useMeasuredBox<HTMLDivElement>()
  const emojiSize = emojiSizeFor(
    emojis.length,
    usableWidth(box.width),
    usableHeight(box.height),
  )

  return (
    <section className="composer">
      {/* The box never grows. Emoji shrink to fit it, so the picker never
          moves. Its height comes from CSS: two rows on a phone, the whole
          left column on a desktop. */}
      <div className="composer-strip" data-testid="strip" ref={stripRef}>
        {emojis.map((emoji, index) => (
          <span
            className={`composer-emoji${index === speakingIndex ? ' is-speaking' : ''}`}
            data-testid="composer-emoji"
            key={`${emoji}-${index}`}
            // Width is pinned as well as font size: an emoji glyph draws
            // wider than its font size, which would break the fit maths.
            style={{ fontSize: `${emojiSize}px`, width: `${emojiSize}px` }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* The track and the hint line are always here, even when they have
          nothing to show, so turning them on never shoves the keyboard down. */}
      <div
        className="composer-progress"
        data-testid="progress-track"
        {...(isSpeaking
          ? {
              role: 'progressbar',
              'aria-label': 'Reading progress',
              'aria-valuenow': done,
              'aria-valuemin': 0,
              'aria-valuemax': emojis.length,
            }
          : {})}
      >
        <div
          className="composer-progress-fill"
          data-testid="progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="composer-hint" data-testid="hint">
        {!canSpeak
          ? 'This device has no voice'
          : isEmpty
            ? 'Tap an emoji to start'
            : ' '}
      </p>

      <div className="composer-buttons">
        {canSpeak &&
          (isSpeaking ? (
            <button
              type="button"
              className="composer-button composer-stop"
              onClick={onStop}
              aria-label="Stop"
            >
              <span aria-hidden="true">⏹️</span> Stop
            </button>
          ) : (
            <button
              type="button"
              className="composer-button composer-play"
              onClick={onPlay}
              disabled={isEmpty}
              aria-label="Play"
            >
              <span aria-hidden="true">▶️</span> Play
            </button>
          ))}
        <button
          type="button"
          className="composer-button"
          onClick={onBackspace}
          disabled={isEmpty}
          aria-label="Undo"
        >
          <span aria-hidden="true">⌫</span> Undo
        </button>
        <button
          type="button"
          className="composer-button"
          onClick={onClear}
          disabled={isEmpty}
          aria-label="Clear"
        >
          <span aria-hidden="true">🗑️</span> Clear
        </button>
      </div>
    </section>
  )
}
