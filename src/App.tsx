import { useCallback, useMemo, useState } from 'react'
import Composer from './Composer'
import EmojiPicker from './EmojiPicker'
import { buildLabelMap, buildSentence, lookupLabel } from './labels'
import { useSpeech } from './useSpeech'
import './App.css'

export default function App() {
  const labelMap = useMemo(() => buildLabelMap(), [])
  const { isSupported, speak } = useSpeech()
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
    speak(buildSentence(labelMap, emojis))
  }, [emojis, labelMap, speak])

  const handleBackspace = useCallback(() => {
    setEmojis((current) => current.slice(0, -1))
  }, [])

  const handleClear = useCallback(() => {
    setEmojis([])
  }, [])

  return (
    <main className="app">
      <h1 className="app-title">Emoji Keyboard</h1>

      <Composer
        emojis={emojis}
        canSpeak={isSupported}
        onPlay={handlePlay}
        onBackspace={handleBackspace}
        onClear={handleClear}
      />

      <div className="app-picker">
        <EmojiPicker onEmojiSelect={handleSelect} />
      </div>
    </main>
  )
}
