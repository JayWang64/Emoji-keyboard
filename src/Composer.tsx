import './Composer.css'

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

  return (
    <section className="composer">
      <div className="composer-strip" data-testid="strip">
        {emojis.map((emoji, index) => (
          <span
            className={`composer-emoji${index === speakingIndex ? ' is-speaking' : ''}`}
            data-testid="composer-emoji"
            key={`${emoji}-${index}`}
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
