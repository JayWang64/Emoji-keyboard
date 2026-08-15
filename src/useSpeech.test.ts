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

describe('useSpeech', () => {
  let spoken: SpeechSynthesisUtterance[]
  let cancelCount: number

  beforeEach(() => {
    spoken = []
    cancelCount = 0
    class FakeUtterance {
      text: string
      voice: SpeechSynthesisVoice | null = null
      rate = 1
      pitch = 1
      volume = 1
      lang = ''
      constructor(text: string) {
        this.text = text
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => [voice('Samantha', 'en-US')],
      speak: (u: SpeechSynthesisUtterance) => spoken.push(u),
      cancel: () => {
        cancelCount += 1
      },
      addEventListener: () => {},
      removeEventListener: () => {},
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports support when speechSynthesis exists', () => {
    const { result } = renderHook(() => useSpeech())
    expect(result.current.isSupported).toBe(true)
  })

  it('cancels then speaks once', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speak('dog face'))
    expect(cancelCount).toBe(1)
    expect(spoken).toHaveLength(1)
    expect(spoken[0].text).toBe('dog face')
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
