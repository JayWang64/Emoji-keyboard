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

export type Speech = {
  isSupported: boolean
  /** Position in the current sequence, or null when nothing is being read. */
  speakingIndex: number | null
  /** The word being said right now, or null when silent. */
  spokenText: string | null
  /** Say one thing now, cutting off whatever was being said. */
  speak: (text: string) => void
  /** Say each word in turn, reporting progress through speakingIndex. */
  speakSequence: (words: string[]) => void
  /** Silence the engine. The last word stays on screen. */
  stop: () => void
  /** Wipe the last word from the display. */
  clearWord: () => void
}

export function useSpeech(): Speech {
  const [isSupported] = useState(() => synth() !== null)
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)
  const [spokenText, setSpokenText] = useState<string | null>(null)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  // Bumped whenever a run is started or abandoned. An end event carrying a
  // stale id is ignored, which matters because cancel() makes some browsers
  // fire onend for the utterance they just interrupted.
  const runIdRef = useRef(0)

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

  const buildUtterance = useCallback((text: string) => {
    const engine = synth()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = voiceRef.current ?? pickVoice(engine?.getVoices() ?? [])
    if (voice) utterance.voice = voice
    utterance.rate = RATE
    utterance.pitch = PITCH
    utterance.volume = 1
    utterance.lang = LANG
    return utterance
  }, [])

  /**
   * Abandon any run in flight and silence the engine.
   *
   * Only cancels when the engine actually has something going. Chrome drops
   * an utterance that is queued in the same tick as a cancel, so cancelling
   * when there is nothing to cancel can silence the very next word.
   */
  const halt = useCallback(() => {
    runIdRef.current += 1
    const engine = synth()
    if (!engine) return
    if (engine.speaking || engine.pending) engine.cancel()
  }, [])

  const stop = useCallback(() => {
    halt()
    setSpeakingIndex(null)
    // The word stays on screen. It is the last thing that was said, and a
    // child needs longer than one utterance to read it.
  }, [halt])

  /** Wipe the word from the header, for when the strip is emptied. */
  const clearWord = useCallback(() => setSpokenText(null), [])

  const speak = useCallback(
    (text: string) => {
      const engine = synth()
      if (!engine || !text) return
      stop()

      setSpokenText(text)
      // Chrome can leave the engine paused after a cancel.
      if (engine.paused) engine.resume()
      engine.speak(buildUtterance(text))
    },
    [buildUtterance, stop],
  )

  const speakSequence = useCallback(
    (words: string[]) => {
      const engine = synth()
      if (!engine || words.length === 0) return

      halt()
      const runId = runIdRef.current
      if (engine.paused) engine.resume()

      const sayFrom = (index: number) => {
        if (runIdRef.current !== runId) return
        if (index >= words.length) {
          setSpeakingIndex(null)
          // Last word stays in the header rather than blinking out.
          return
        }
        setSpeakingIndex(index)
        setSpokenText(words[index])
        const utterance = buildUtterance(words[index])
        utterance.onend = () => sayFrom(index + 1)
        // A word the engine refuses to say should not stall the whole row.
        utterance.onerror = () => sayFrom(index + 1)
        engine.speak(utterance)
      }

      sayFrom(0)
    },
    [buildUtterance, halt],
  )

  return {
    isSupported,
    speakingIndex,
    spokenText,
    speak,
    speakSequence,
    stop,
    clearWord,
  }
}
