# Emoji Sentence Composer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a talking emoji keyboard where each tap speaks that emoji's word and a Play button speaks the whole tapped row as one sentence.

**Architecture:** A single-page React app with no server. `emojibase-data` supplies an emoji-to-word lookup table built once at startup. The browser's Web Speech API does the talking. `App` owns one piece of state, an array of tapped emoji strings; `Composer` renders it; the `emoji-mart` picker appends to it.

**Tech Stack:** Vite 7, React 19, TypeScript 5, `@emoji-mart/react` + `@emoji-mart/data`, `emojibase-data`, Vitest 3 + `@testing-library/react` + jsdom.

**Spec:** `docs/superpowers/specs/2026-08-15-emoji-sentence-composer-design.md`

## Global Constraints

- English only. Import `emojibase-data/en/data.json`. Utterance `lang` is `"en-US"`.
- Speech settings are exactly `rate = 1.05`, `pitch = 1.55`, `volume = 1`.
- Voice name preference order, checked against `en`-prefixed voices only:
  `/samantha/i`, `/ava/i`, `/victoria/i`, `/karen/i`, `/moira/i`, `/allison/i`, `/zira/i`, `/female/i`, `/woman/i`. Fall back to the first `en` voice, then the first voice of any language.
- Unknown emoji speaks the literal word `"symbol"`.
- Sentence separator is exactly `", "`.
- No chat bubbles, no bot, no extra languages, no persistence, no analytics.
- `overrides` in `src/labels.ts` ships exported and empty. Do not populate it.
- Every commit message ends with the two trailer lines used in Task 1's commit.
- The repo's old root `index.html` is replaced by the Vite `index.html`. Do not preserve its markup.

---

### Task 1: Project scaffold and test harness

Sets up Vite, React, TypeScript, and Vitest, and proves the test runner works. Everything later depends on this.

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/setupTests.ts`, `src/smoke.test.ts`
- Delete: the existing root `index.html` is overwritten by the new one

**Interfaces:**
- Consumes: nothing
- Produces: a working `npm test` and `npm run dev`; `src/App.tsx` exporting `default function App()`

- [ ] **Step 1: Scaffold with Vite and install dependencies**

Run from the repo root:

```bash
rm -f index.html
npm create vite@latest . -- --template react-ts
npm install
npm install emojibase-data @emoji-mart/data @emoji-mart/react emoji-mart
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

If `npm create vite` refuses because the directory is not empty, answer its prompt to ignore existing files and continue. Do not let it delete `.git`, `docs/`, or `README.md`.

- [ ] **Step 2: Configure Vitest**

Replace `vite.config.ts` with:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
})
```

Create `src/setupTests.ts`:

```ts
import '@testing-library/jest-dom'
```

Add the test script to `package.json` under `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Write a smoke test that fails**

Create `src/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { harnessWorks } from './smoke'

describe('test harness', () => {
  it('runs', () => {
    expect(harnessWorks()).toBe(true)
  })
})
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npm test`
Expected: FAIL, cannot resolve `./smoke`.

- [ ] **Step 5: Make it pass**

Create `src/smoke.ts`:

```ts
export function harnessWorks(): boolean {
  return true
}
```

- [ ] **Step 6: Run the tests and verify they pass**

Run: `npm test`
Expected: PASS, 1 test.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Scaffold Vite React TypeScript app with Vitest

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JCABtNWHbXY9pigmABPfoR
EOF
)"
```

---

### Task 2: Emoji label lookup and sentence builder

The heart of the app. Turns emoji characters into spoken words. Pure functions, no React, no browser APIs.

**Files:**
- Create: `src/labels.ts`
- Test: `src/labels.test.ts`

**Interfaces:**
- Consumes: `emojibase-data/en/data.json`
- Produces:
  - `export type LabelMap = Map<string, string>`
  - `export const overrides: Record<string, string>`
  - `export function normalize(input: string): string`
  - `export function stripTones(input: string): string`
  - `export function buildLabelMap(): LabelMap`
  - `export function lookupLabel(map: LabelMap, emoji: string): string`
  - `export function buildSentence(map: LabelMap, emojis: string[]): string`

**Background the implementer needs:** `emojibase-data/en/data.json` is an array of about 1,949 entries. Each entry has `label` (the human word), `emoji` (the emoji-presentation string), `text` (the text-presentation string, often `""`), and an optional `skins` array whose members have the same shape. Emojibase stores many emoji with a trailing variation selector `U+FE0F` that a keyboard or picker does not emit, so both the map keys and the lookup input must be normalized or nothing matches.

- [ ] **Step 1: Write the failing tests**

Create `src/labels.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  buildLabelMap,
  buildSentence,
  lookupLabel,
  normalize,
  overrides,
  stripTones,
} from './labels'

const map = buildLabelMap()

describe('normalize', () => {
  it('strips the emoji variation selector', () => {
    expect(normalize('❤️')).toBe('❤')
  })

  it('strips the text variation selector', () => {
    expect(normalize('❤︎')).toBe('❤')
  })

  it('leaves a plain emoji alone', () => {
    expect(normalize('🐶')).toBe('🐶')
  })
})

describe('stripTones', () => {
  it('removes a skin tone modifier', () => {
    expect(stripTones('👍🏽')).toBe('👍')
  })

  it('leaves an untoned emoji alone', () => {
    expect(stripTones('👍')).toBe('👍')
  })
})

describe('buildLabelMap', () => {
  it('indexes a large number of emoji', () => {
    expect(map.size).toBeGreaterThan(3000)
  })
})

describe('lookupLabel', () => {
  it('resolves a plain emoji', () => {
    expect(lookupLabel(map, '🐶')).toBe('dog face')
  })

  it('resolves an emoji that carries a variation selector', () => {
    expect(lookupLabel(map, '❤️')).toBe('red heart')
  })

  it('resolves the same emoji without its variation selector', () => {
    expect(lookupLabel(map, '❤')).toBe('red heart')
  })

  it('resolves an emoji the data stores with a variation selector', () => {
    expect(lookupLabel(map, '👍')).toBe('thumbs up')
  })

  it('drops the skin tone qualifier from the spoken word', () => {
    expect(lookupLabel(map, '👍🏽')).toBe('thumbs up')
    expect(lookupLabel(map, '👋🏿')).toBe('waving hand')
  })

  it('resolves multi-part sequences', () => {
    expect(lookupLabel(map, '👨‍👩‍👧')).toBe('family: man, woman, girl')
    expect(lookupLabel(map, '🏳️‍🌈')).toBe('rainbow flag')
  })

  it('falls back to symbol for unknown input', () => {
    expect(lookupLabel(map, 'abc')).toBe('symbol')
    expect(lookupLabel(map, '')).toBe('symbol')
  })

  it('lets an override win over the emojibase label', () => {
    overrides['🐶'] = 'doggy'
    try {
      expect(lookupLabel(map, '🐶')).toBe('doggy')
    } finally {
      delete overrides['🐶']
    }
  })

  it('ships with no overrides', () => {
    expect(Object.keys(overrides)).toHaveLength(0)
  })
})

describe('buildSentence', () => {
  it('joins words in tap order', () => {
    expect(buildSentence(map, ['🐶', '🍎', '😀'])).toBe(
      'dog face, red apple, grinning face',
    )
  })

  it('returns an empty string for no emoji', () => {
    expect(buildSentence(map, [])).toBe('')
  })

  it('handles a single emoji', () => {
    expect(buildSentence(map, ['🥔'])).toBe('potato')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/labels.test.ts`
Expected: FAIL, cannot resolve `./labels`.

- [ ] **Step 3: Write the implementation**

Create `src/labels.ts`:

```ts
import emojiData from 'emojibase-data/en/data.json'

export type LabelMap = Map<string, string>

/**
 * Kid-friendly words that beat the official emojibase label.
 * Intentionally empty for now. Add entries like { '🐶': 'doggy' } later.
 */
export const overrides: Record<string, string> = {}

const VARIATION_SELECTORS = /[︎️]/g
const SKIN_TONES = /[\u{1F3FB}-\u{1F3FF}]/gu

export function normalize(input: string): string {
  return input.replace(VARIATION_SELECTORS, '')
}

export function stripTones(input: string): string {
  return input.replace(SKIN_TONES, '')
}

type RawEmoji = {
  label: string
  emoji?: string
  text?: string
  skins?: RawEmoji[]
}

function indexEntry(map: LabelMap, entry: RawEmoji): void {
  if (entry.emoji) map.set(normalize(entry.emoji), entry.label)
  if (entry.text) map.set(normalize(entry.text), entry.label)
  for (const skin of entry.skins ?? []) indexEntry(map, skin)
}

export function buildLabelMap(): LabelMap {
  const map: LabelMap = new Map()
  for (const entry of emojiData as RawEmoji[]) indexEntry(map, entry)
  return map
}

export function lookupLabel(map: LabelMap, emoji: string): string {
  const override = overrides[emoji]
  if (override) return override

  const normalized = normalize(emoji)
  // Tone-stripped first: it yields "thumbs up" where the exact key would
  // yield "thumbs up: medium skin tone".
  return map.get(stripTones(normalized)) ?? map.get(normalized) ?? 'symbol'
}

export function buildSentence(map: LabelMap, emojis: string[]): string {
  return emojis.map((emoji) => lookupLabel(map, emoji)).join(', ')
}
```

If TypeScript complains about importing a `.json` file, add `"resolveJsonModule": true` to `compilerOptions` in `tsconfig.json`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/labels.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add src/labels.ts src/labels.test.ts tsconfig.json
git commit -m "$(cat <<'EOF'
Add emoji label lookup and sentence builder

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JCABtNWHbXY9pigmABPfoR
EOF
)"
```

---

### Task 3: Speech hook

Wraps the Web Speech API so the rest of the app never touches it directly.

**Files:**
- Create: `src/useSpeech.ts`
- Test: `src/useSpeech.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces:
  - `export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null`
  - `export function useSpeech(): { isSupported: boolean; speak: (text: string) => void }`

**Background the implementer needs:** `window.speechSynthesis.getVoices()` returns an empty array on the first call in Chrome and Safari; the browser fires a `voiceschanged` event once the list is ready. `pickVoice` is exported separately from the hook so it can be tested without React.

- [ ] **Step 1: Write the failing tests**

Create `src/useSpeech.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { pickVoice, useSpeech } from './useSpeech'

function voice(name: string, lang: string): SpeechSynthesisVoice {
  return { name, lang, default: false, localService: true, voiceURI: name } as SpeechSynthesisVoice
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/useSpeech.test.ts`
Expected: FAIL, cannot resolve `./useSpeech`.

- [ ] **Step 3: Write the implementation**

Create `src/useSpeech.ts`:

```ts
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
  const english = voices.filter((v) => (v.lang || '').toLowerCase().startsWith('en'))
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/useSpeech.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add src/useSpeech.ts src/useSpeech.test.ts
git commit -m "$(cat <<'EOF'
Add useSpeech hook wrapping the Web Speech API

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JCABtNWHbXY9pigmABPfoR
EOF
)"
```

---

### Task 4: Composer strip and buttons

The visible top half. Presentational only, no state of its own.

**Files:**
- Create: `src/Composer.tsx`, `src/Composer.css`
- Test: `src/Composer.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces:
  - `export type ComposerProps = { emojis: string[]; canSpeak: boolean; onPlay: () => void; onBackspace: () => void; onClear: () => void }`
  - `export default function Composer(props: ComposerProps)`

- [ ] **Step 1: Write the failing tests**

Create `src/Composer.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Composer from './Composer'

const noop = () => {}

function setup(overrides: Partial<React.ComponentProps<typeof Composer>> = {}) {
  const props = {
    emojis: ['🐶', '🍎'],
    canSpeak: true,
    onPlay: noop,
    onBackspace: noop,
    onClear: noop,
    ...overrides,
  }
  render(<Composer {...props} />)
  return props
}

describe('Composer', () => {
  it('shows the tapped emoji in order', () => {
    setup()
    const strip = screen.getByTestId('strip')
    expect(strip.textContent).toBe('🐶🍎')
  })

  it('shows a prompt when empty', () => {
    setup({ emojis: [] })
    expect(screen.getByText(/tap an emoji/i)).toBeInTheDocument()
  })

  it('calls onPlay when Play is pressed', async () => {
    const onPlay = vi.fn()
    setup({ onPlay })
    await userEvent.click(screen.getByRole('button', { name: /play/i }))
    expect(onPlay).toHaveBeenCalledTimes(1)
  })

  it('calls onBackspace and onClear', async () => {
    const onBackspace = vi.fn()
    const onClear = vi.fn()
    setup({ onBackspace, onClear })
    await userEvent.click(screen.getByRole('button', { name: /undo/i }))
    await userEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(onBackspace).toHaveBeenCalledTimes(1)
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('disables the buttons when the strip is empty', () => {
    setup({ emojis: [] })
    expect(screen.getByRole('button', { name: /play/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /clear/i })).toBeDisabled()
  })

  it('hides Play and explains when the device cannot speak', () => {
    setup({ canSpeak: false })
    expect(screen.queryByRole('button', { name: /play/i })).toBeNull()
    expect(screen.getByText(/no voice/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/Composer.test.tsx`
Expected: FAIL, cannot resolve `./Composer`.

- [ ] **Step 3: Write the component**

Create `src/Composer.tsx`:

```tsx
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
```

Create `src/Composer.css`:

```css
.composer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(74, 63, 138, 0.15);
}

.composer-strip {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 64px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px;
}

.composer-emoji {
  font-size: 2.75rem;
  line-height: 1;
  flex-shrink: 0;
}

.composer-hint {
  margin: 0;
  color: #6c5bbf;
  font-size: 0.95rem;
  text-align: center;
}

.composer-buttons {
  display: flex;
  gap: 8px;
}

.composer-button {
  flex: 1;
  min-height: 56px;
  font-size: 1.05rem;
  font-weight: 700;
  color: #4a3f8a;
  background: #f0f4ff;
  border: 2px solid #c5b8f0;
  border-radius: 12px;
  cursor: pointer;
}

.composer-button:disabled {
  opacity: 0.45;
  cursor: default;
}

.composer-play {
  flex: 2;
  background: #d9f5e0;
  border-color: #8fd8a6;
  color: #256b3c;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/Composer.test.tsx`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add src/Composer.tsx src/Composer.css src/Composer.test.tsx
git commit -m "$(cat <<'EOF'
Add Composer strip with Play, Undo and Clear

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JCABtNWHbXY9pigmABPfoR
EOF
)"
```

---

### Task 5: Wire the app together

Joins the picker, the composer and the speech hook. Delivers the working toy.

**Files:**
- Modify: `src/App.tsx` (replace the Vite starter content entirely), `src/index.css`, `index.html`
- Create: `src/App.css`
- Test: `src/App.test.tsx`
- Delete: `src/smoke.ts`, `src/smoke.test.ts`, `src/assets/react.svg`, `src/App.css` starter content

**Interfaces:**
- Consumes: `buildLabelMap`, `lookupLabel`, `buildSentence` from `src/labels.ts`; `useSpeech` from `src/useSpeech.ts`; `Composer` from `src/Composer.tsx`
- Produces: `export default function App()`

**Background the implementer needs:** `@emoji-mart/react`'s `Picker` calls `onEmojiSelect` with an object whose `native` property holds the emoji string. The picker is a web component under the hood and does not render meaningfully in jsdom, so `src/App.test.tsx` mocks it with a plain button.

- [ ] **Step 1: Write the failing test**

Create `src/App.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const spoken: string[] = []

vi.mock('./useSpeech', () => ({
  useSpeech: () => ({
    isSupported: true,
    speak: (text: string) => {
      spoken.push(text)
    },
  }),
}))

vi.mock('@emoji-mart/react', () => ({
  default: ({ onEmojiSelect }: { onEmojiSelect: (e: { native: string }) => void }) => (
    <div>
      <button type="button" onClick={() => onEmojiSelect({ native: '🐶' })}>
        pick dog
      </button>
      <button type="button" onClick={() => onEmojiSelect({ native: '🍎' })}>
        pick apple
      </button>
    </div>
  ),
}))

vi.mock('@emoji-mart/data', () => ({ default: {} }))

import App from './App'

describe('App', () => {
  beforeEach(() => {
    spoken.length = 0
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('speaks each emoji as it is tapped', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('pick dog'))
    await userEvent.click(screen.getByText('pick apple'))
    expect(spoken).toEqual(['dog face', 'red apple'])
  })

  it('adds tapped emoji to the strip', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('pick dog'))
    await userEvent.click(screen.getByText('pick apple'))
    expect(screen.getByTestId('strip').textContent).toBe('🐶🍎')
  })

  it('speaks the whole sentence once when Play is pressed', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('pick dog'))
    await userEvent.click(screen.getByText('pick apple'))
    spoken.length = 0
    await userEvent.click(screen.getByRole('button', { name: /play/i }))
    expect(spoken).toEqual(['dog face, red apple'])
  })

  it('undo removes the last emoji only', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('pick dog'))
    await userEvent.click(screen.getByText('pick apple'))
    await userEvent.click(screen.getByRole('button', { name: /undo/i }))
    expect(screen.getByTestId('strip').textContent).toBe('🐶')
  })

  it('clear empties the strip', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('pick dog'))
    await userEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(screen.getByTestId('strip').textContent).toBe('')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL, the Vite starter `App` renders no strip.

- [ ] **Step 3: Write the app**

Replace `src/App.tsx` entirely with:

```tsx
import { useCallback, useMemo, useState } from 'react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import Composer from './Composer'
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
        <Picker
          data={data}
          onEmojiSelect={handleSelect}
          previewPosition="none"
          skinTonePosition="search"
          navPosition="top"
          maxFrequentRows={1}
          emojiSize={32}
          emojiButtonSize={44}
          dynamicWidth
        />
      </div>
    </main>
  )
}
```

Replace `src/App.css` entirely with:

```css
.app {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100dvh;
  max-width: 820px;
  margin: 0 auto;
  padding: 8px;
}

.app-title {
  margin: 0;
  font-size: 1.3rem;
  color: #4a3f8a;
  text-align: center;
}

.app-picker {
  flex: 1;
  min-height: 0;
  display: flex;
}

.app-picker em-emoji-picker {
  flex: 1;
  min-height: 0;
  height: 100%;
  width: 100%;
}
```

Replace `src/index.css` entirely with:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
}

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: #f0f4ff;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}
```

In `index.html`, set the title to `Emoji Keyboard` and set the viewport meta to:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

Delete the scaffold leftovers:

```bash
rm -f src/smoke.ts src/smoke.test.ts src/assets/react.svg
```

- [ ] **Step 4: Run the whole suite to verify it passes**

Run: `npm test`
Expected: PASS, every test in `labels`, `useSpeech`, `Composer` and `App`.

- [ ] **Step 5: Verify the production build compiles**

Run: `npm run build`
Expected: success, no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Wire picker, composer and speech into the app

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JCABtNWHbXY9pigmABPfoR
EOF
)"
```

---

### Task 6: README and manual check

Documents the project and confirms it actually talks in a real browser.

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the finished app
- Produces: nothing code depends on

- [ ] **Step 1: Write the README**

Replace `README.md` with:

```markdown
# Emoji Keyboard

A talking emoji keyboard for young children.

- Tap an emoji and it is spoken out loud straight away.
- Taps collect in a strip at the top.
- Press **Play** and the whole strip is read as one sentence.
- **Undo** removes the last emoji. **Clear** empties the strip.

## Running it

```bash
npm install
npm run dev
```

Then open the address the terminal prints.

## Testing

```bash
npm test
```

## How the voice works

The browser's built-in Web Speech API does the talking. There is no server,
no account and no API key. Voice quality depends on the device.

## How the words are chosen

Every emoji's word comes from [`emojibase-data`](https://github.com/milesj/emojibase),
which carries the official CLDR label for each emoji, such as "red apple" or
"dog face". Nothing is hand-typed.

To use friendlier words, add entries to `overrides` in `src/labels.ts`:

```ts
export const overrides: Record<string, string> = {
  '🐶': 'doggy',
  '🚗': 'car',
}
```

An override always wins over the official label.

## Design docs

- Spec: `docs/superpowers/specs/2026-08-15-emoji-sentence-composer-design.md`
- Plan: `docs/superpowers/plans/2026-08-15-emoji-sentence-composer.md`
```

- [ ] **Step 2: Start the dev server and check it by hand**

Run: `npm run dev`

Confirm, in a real browser with sound on:
1. The picker renders and fills the lower part of the screen.
2. Tapping an emoji speaks its word immediately.
3. The tapped emoji appears in the strip.
4. Play speaks all the words as one sentence, in tap order.
5. Undo removes only the last emoji.
6. Clear empties the strip and the buttons go dim.

Stop the server when done.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
Add README covering usage, voices and word overrides

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JCABtNWHbXY9pigmABPfoR
EOF
)"
```

---

## Spec coverage check

| Spec requirement | Task |
|---|---|
| Vite + React + TS, Vitest | 1 |
| emojibase label map, normalize, stripTones, overrides, buildSentence | 2 |
| Web Speech API, voice preference, rate/pitch, voiceschanged | 3 |
| Composer strip, Play/Backspace/Clear, empty state, no-speech note | 4 |
| Speak on tap, Play speaks whole sentence, picker wiring | 5 |
| Old root `index.html` replaced | 1, 5 |
| Unknown emoji speaks "symbol" | 2 |
| iOS first-utterance-in-a-gesture satisfied by construction | 5 (every speak is inside a click handler) |
| Docs | 6 |
