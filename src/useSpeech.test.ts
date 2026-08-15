import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { pickVoice, useSpeech } from './useSpeech'

function voice(name: string, lang: string): SpeechSynthesisVoice {
  return {
    name,
    lang,
    default: false,
    localService: true,
    voiceURI: name,
  } as SpeechSynthesisVoice
}

describe('pickVoice', () => {
  it('returns null for an empty list', () => {
    expect(pickVoice([])).toBeNull()
  })

  it('prefers a named voice over a non-matching one', () => {
    const picked = pickVoice([voice('Daniel', 'en-GB'), voice('Samantha', 'en-US')])
    expect(picked?.name).toBe('Samantha')
  })

  it('respects the preference order', () => {
    const picked = pickVoice([voice('Zira', 'en-US'), voice('Ava', 'en-US')])
    expect(picked?.name).toBe('Ava')
  })

  it('ignores voices that are not English', () => {
    const picked = pickVoice([voice('Amelie', 'fr-FR'), voice('Daniel', 'en-GB')])
    expect(picked?.name).toBe('Daniel')
  })

  it('falls back to the first voice when none are English', () => {
    const picked = pickVoice([voice('Amelie', 'fr-FR')])
    expect(picked?.name).toBe('Amelie')
  })
})

/** Minimal stand-in for the browser's speech engine. */
type FakeUtterance = SpeechSynthesisUtterance & { onend: (() => void) | null }

let spoken: FakeUtterance[]
let cancelCount: number

function installFakeEngine() {
  spoken = []
  cancelCount = 0

  class Utterance {
    text: string
    voice: SpeechSynthesisVoice | null = null
    rate = 1
    pitch = 1
    volume = 1
    lang = ''
    onend: (() => void) | null = null
    onerror: (() => void) | null = null
    constructor(text: string) {
      this.text = text
    }
  }

  vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
  const engine = {
    speaking: false,
    pending: false,
    paused: false,
    getVoices: () => [voice('Samantha', 'en-US')],
    speak: (u: FakeUtterance) => {
      spoken.push(u)
      engine.speaking = true
    },
    cancel: () => {
      cancelCount += 1
      engine.speaking = false
      // Real engines fire onend for the utterance they interrupt.
      const pending = spoken[spoken.length - 1]
      pending?.onend?.()
    },
    resume: () => {
      engine.paused = false
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  }
  vi.stubGlobal('speechSynthesis', engine)
}

/** Pretend the browser finished saying the most recent utterance. */
function finishCurrent() {
  const current = spoken[spoken.length - 1]
  ;(window.speechSynthesis as unknown as { speaking: boolean }).speaking = false
  act(() => current.onend?.())
}

describe('useSpeech', () => {
  beforeEach(installFakeEngine)
  afterEach(() => vi.unstubAllGlobals())

  it('reports support when speechSynthesis exists', () => {
    const { result } = renderHook(() => useSpeech())
    expect(result.current.isSupported).toBe(true)
  })

  it('speaks once', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speak('dog face'))
    expect(spoken).toHaveLength(1)
    expect(spoken[0].text).toBe('dog face')
  })

  it('does not cancel when the engine is idle', () => {
    // Chrome drops an utterance queued in the same tick as a needless
    // cancel, which silences the word entirely.
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speak('dog face'))
    expect(cancelCount).toBe(0)
  })

  it('cancels the word in progress when a new one arrives', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speak('dog face'))
    act(() => result.current.speak('red apple'))
    expect(cancelCount).toBe(1)
    expect(spoken.map((u) => u.text)).toEqual(['dog face', 'red apple'])
  })

  it('applies the configured rate, pitch and voice', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speak('potato'))
    expect(spoken[0].rate).toBeCloseTo(1.05)
    expect(spoken[0].pitch).toBeCloseTo(1.55)
    expect(spoken[0].volume).toBe(1)
    expect(spoken[0].lang).toBe('en-US')
    expect(spoken[0].voice?.name).toBe('Samantha')
  })

  it('says nothing for empty text', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speak(''))
    expect(spoken).toHaveLength(0)
    expect(cancelCount).toBe(0)
  })

  it('reports no support when speechSynthesis is absent', () => {
    vi.unstubAllGlobals()
    vi.stubGlobal('speechSynthesis', undefined)
    const { result } = renderHook(() => useSpeech())
    expect(result.current.isSupported).toBe(false)
    act(() => result.current.speak('hello'))
    expect(spoken).toHaveLength(0)
  })
})

describe('useSpeech speakSequence', () => {
  beforeEach(installFakeEngine)
  afterEach(() => vi.unstubAllGlobals())

  it('speaks only the first word up front', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speakSequence(['dog face', 'red apple']))
    expect(spoken.map((u) => u.text)).toEqual(['dog face'])
  })

  it('advances to the next word when the current one ends', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speakSequence(['dog face', 'red apple']))
    finishCurrent()
    expect(spoken.map((u) => u.text)).toEqual(['dog face', 'red apple'])
  })

  it('reports the position it is speaking', () => {
    const { result } = renderHook(() => useSpeech())
    expect(result.current.speakingIndex).toBeNull()

    act(() => result.current.speakSequence(['dog face', 'red apple']))
    expect(result.current.speakingIndex).toBe(0)

    finishCurrent()
    expect(result.current.speakingIndex).toBe(1)
  })

  it('clears the position once the last word ends', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speakSequence(['dog face', 'red apple']))
    finishCurrent()
    finishCurrent()
    expect(result.current.speakingIndex).toBeNull()
    expect(spoken).toHaveLength(2)
  })

  it('does nothing for an empty list', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speakSequence([]))
    expect(spoken).toHaveLength(0)
    expect(result.current.speakingIndex).toBeNull()
  })

  it('starts a new run cleanly when pressed twice', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speakSequence(['one', 'two', 'three']))
    act(() => result.current.speakSequence(['alpha', 'beta']))
    expect(spoken.map((u) => u.text)).toEqual(['one', 'alpha'])
    expect(result.current.speakingIndex).toBe(0)

    finishCurrent()
    expect(spoken.map((u) => u.text)).toEqual(['one', 'alpha', 'beta'])
  })
})

describe('useSpeech stop', () => {
  beforeEach(installFakeEngine)
  afterEach(() => vi.unstubAllGlobals())

  it('cancels the engine and clears the position', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speakSequence(['dog face', 'red apple']))
    act(() => result.current.stop())
    expect(cancelCount).toBeGreaterThan(0)
    expect(result.current.speakingIndex).toBeNull()
  })

  it('does not advance to the next word after stopping', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speakSequence(['dog face', 'red apple', 'potato']))
    act(() => result.current.stop())
    expect(spoken.map((u) => u.text)).toEqual(['dog face'])
  })

  it('a late end event from a stopped run is ignored', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speakSequence(['dog face', 'red apple']))
    const stale = spoken[0]
    act(() => result.current.stop())
    act(() => stale.onend?.())
    expect(spoken.map((u) => u.text)).toEqual(['dog face'])
    expect(result.current.speakingIndex).toBeNull()
  })

  it('a single speak stops the sequence too', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speakSequence(['dog face', 'red apple']))
    act(() => result.current.speak('tapped word'))
    expect(result.current.speakingIndex).toBeNull()
    expect(spoken.map((u) => u.text)).toEqual(['dog face', 'tapped word'])
  })
})

describe('useSpeech spokenText', () => {
  beforeEach(installFakeEngine)
  afterEach(() => vi.unstubAllGlobals())

  it('is empty when nothing has been said', () => {
    const { result } = renderHook(() => useSpeech())
    expect(result.current.spokenText).toBeNull()
  })

  it('reports the word a single speak is saying', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speak('dog face'))
    expect(result.current.spokenText).toBe('dog face')
  })

  it('keeps the word up after it finishes, long enough to read', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speak('dog face'))
    finishCurrent()
    expect(result.current.spokenText).toBe('dog face')
  })

  it('follows a sequence word by word', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speakSequence(['dog face', 'red apple']))
    expect(result.current.spokenText).toBe('dog face')
    finishCurrent()
    expect(result.current.spokenText).toBe('red apple')
    finishCurrent()
    expect(result.current.spokenText).toBe('red apple')
  })

  it('keeps the last word when stopped', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speakSequence(['dog face', 'red apple']))
    act(() => result.current.stop())
    expect(result.current.spokenText).toBe('dog face')
  })

  it('clearWord wipes it', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speak('dog face'))
    act(() => result.current.clearWord())
    expect(result.current.spokenText).toBeNull()
  })
})
