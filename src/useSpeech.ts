import { useCallback, useEffect, useRef, useState } from 'react'

const RATE = 1.05
const PITCH = 1.55
const LANG = 'en-US'

const NAME_PREFERENCES = [
  /samantha/i,
  /ava/i,
  /victoria/i,
  /karen/i,
  /moira/i,
  /allison/i,
  /zira/i,
  /female/i,
  /woman/i,
]

export function pickVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null
  const english = voices.filter((v) =>
    (v.lang || '').toLowerCase().startsWith('en'),
  )
  const pool = english.length > 0 ? english : voices
  for (const pattern of NAME_PREFERENCES) {
    const match = pool.find((v) => pattern.test(v.name))
    if (match) return match
  }
  return pool[0]
}

function synth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null
  return window.speechSynthesis ?? null
}

export function useSpeech(): {
  isSupported: boolean
  speak: (text: string) => void
} {
  const [isSupported] = useState(() => synth() !== null)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    const engine = synth()
    if (!engine) return

    const resolve = () => {
      voiceRef.current = pickVoice(engine.getVoices())
    }
    resolve()
    engine.addEventListener?.('voiceschanged', resolve)
    return () => engine.removeEventListener?.('voiceschanged', resolve)
  }, [])

  const speak = useCallback((text: string) => {
    const engine = synth()
    if (!engine || !text) return

    const utterance = new SpeechSynthesisUtterance(text)
    const voice = voiceRef.current ?? pickVoice(engine.getVoices())
    if (voice) utterance.voice = voice
    utterance.rate = RATE
    utterance.pitch = PITCH
    utterance.volume = 1
    utterance.lang = LANG

    // Cancel first so a fast-tapping child hears the newest word rather
    // than a growing backlog.
    engine.cancel()
    engine.speak(utterance)
  }, [])

  return { isSupported, speak }
}
