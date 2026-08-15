import './Composer.css'

export type ComposerProps = {
  emojis: string[]
  canSpeak: boolean
  onPlay: () => void
  onBackspace: () => void
  onClear: () => void
}

export default function Composer({
  emojis,
  canSpeak,
  onPlay,
  onBackspace,
  onClear,
}: ComposerProps) {
  const isEmpty = emojis.length === 0

  return (
    <section className="composer">
      <div className="composer-strip" data-testid="strip">
        {emojis.map((emoji, index) => (
          <span className="composer-emoji" key={`${emoji}-${index}`}>
            {emoji}
          </span>
        ))}
      </div>

      {isEmpty && <p className="composer-hint">Tap an emoji to start</p>}
      {!canSpeak && <p className="composer-hint">This device has no voice</p>}

      <div className="composer-buttons">
        {canSpeak && (
          <button
            type="button"
            className="composer-button composer-play"
            onClick={onPlay}
            disabled={isEmpty}
            aria-label="Play"
          >
            <span aria-hidden="true">▶️</span> Play
          </button>
        )}
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
