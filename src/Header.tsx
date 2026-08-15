import './Header.css'

export type HeaderProps = {
  /** The word being spoken right now, or null when silent. */
  word: string | null
}

export default function Header({ word }: HeaderProps) {
  return (
    <header className="header">
      {/* The word slot is always here, blank or not, so the page never
          shifts when a word appears. */}
      {/* A non-breaking space when silent, not an empty string: an empty
          line box has no baseline, which shifts the whole header by a few
          pixels the moment a word appears. */}
      <p className="header-word" data-testid="spoken-word" aria-live="polite">
        {word ?? ' '}
      </p>
      <p className="header-name">Emoji Keyboard</p>
    </header>
  )
}
