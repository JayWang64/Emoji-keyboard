import { useCallback, useMemo, useState } from 'react'
import Composer from './Composer'
import Header from './Header'
import EmojiPicker from './EmojiPicker'
import { buildLabelMap, buildWords, lookupLabel } from './labels'
import { useSpeech } from './useSpeech'
import './App.css'

export default function App() {
  const labelMap = useMemo(() => buildLabelMap(), [])
  const {
    isSupported,
    speakingIndex,
    spokenText,
    speak,
    speakSequence,
    stop,
    clearWord,
  } = useSpeech()
  const [emojis, setEmojis] = useState<string[]>([])

  const handleSelect = useCallback(
    (selected: { native?: string }) => {
      const emoji = selected?.native
      if (!emoji) return
      setEmojis((current) => [...current, emoji])
      speak(lookupLabel(labelMap, emoji))
    },
    [labelMap, speak],
  )

  const handlePlay = useCallback(() => {
    speakSequence(buildWords(labelMap, emojis))
  }, [emojis, labelMap, speakSequence])

  const handleBackspace = useCallback(() => {
    // Stop first, otherwise the highlight would point at a shifted row.
    stop()
    setEmojis((current) => current.slice(0, -1))
  }, [stop])

  const handleClear = useCallback(() => {
    stop()
    clearWord()
    setEmojis([])
  }, [clearWord, stop])

  return (
    <main className="app">
      <Header word={spokenText} />

      {/* Stacked on a phone, side by side from 900px up. */}
      <div className="app-body">
        <Composer
          emojis={emojis}
          canSpeak={isSupported}
          speakingIndex={speakingIndex}
          onPlay={handlePlay}
          onStop={stop}
          onBackspace={handleBackspace}
          onClear={handleClear}
        />

        <div className="app-picker">
          <EmojiPicker onEmojiSelect={handleSelect} />
        </div>
      </div>
    </main>
  )
}
