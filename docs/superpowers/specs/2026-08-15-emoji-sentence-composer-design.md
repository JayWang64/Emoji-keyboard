# Emoji Sentence Composer - Design

Date: 2026-08-15
Status: Approved

## Purpose

A talking emoji keyboard for young children. The child taps emojis. Each tap
speaks that emoji's word out loud immediately. The taps also collect into a
strip at the top of the screen. Pressing Play speaks the whole strip as one
sentence.

The reference site is <https://lizardpotato.brnkmnn.com/>, which speaks one
emoji per tap but has no way to build a multi-emoji phrase. The composer strip
and the Play button are the reason this project exists.

## Key findings from the reference site

- Speech is the browser's built-in Web Speech API (`speechSynthesis` plus
  `SpeechSynthesisUtterance`). No account, no API key, no network cost.
- The reference site picks a female-sounding voice by name pattern, then sets
  `rate = 1.05` and `pitch = 1.55` for a bright, kid-friendly sound.
- Emoji-to-word pairing needs no hand-authoring. `emojibase-data` ships a
  `label` for every emoji ("grinning face", "red apple"), sourced from CLDR.
- The reference site uses the `emoji-mart` picker component.

## Scope

In scope:

- Composer strip, Play, Backspace, Clear.
- Speak-on-tap.
- Raw emojibase labels as the spoken words.
- English (en) only.

Out of scope for this build (all straightforward to add later):

- Chat bubbles and the idle bot from the reference site.
- Kid-friendly word overrides. The override hook ships empty and unused.
- Languages other than English.
- Any server, account, or persistence.

## Stack

- Vite + React + TypeScript.
- `@emoji-mart/react` and `@emoji-mart/data` for the picker.
- `emojibase-data/en/data.json` for labels.
- Vitest for unit tests.

The existing single-file `index.html` at the repo root is replaced by this
project. Its history stays in git.

## Screen layout

Top to bottom, filling the viewport height:

1. **Composer strip** - the tapped emojis, left to right, large. Empty state
   shows a short prompt. Overflows horizontally with scroll when long.
2. **Button row** - Play (▶️), Backspace (⌫), Clear (🗑️). Large touch targets.
3. **Picker** - `emoji-mart`, full width, taking the remaining height, with
   search and category tabs.

## Modules

### `src/labels.ts`

Builds the emoji-to-word lookup and exposes the sentence builder.

- `buildLabelMap()` reads `emojibase-data/en/data.json` and returns a
  `Map<string, string>`. It indexes each entry under its `unicode` string and
  under a normalized key.
- `normalize(emoji)` strips variation selectors (`U+FE0F`, `U+FE0E`) so that
  `❤️` and `❤` both resolve.
- `lookupLabel(map, emoji)` tries, in order: the `overrides` object, the exact
  string, the normalized string, the normalized string with skin-tone modifiers
  (`U+1F3FB`-`U+1F3FF`) removed. Falls back to the string `"symbol"`.
- `overrides: Record<string, string>` is exported and empty. This is the hook
  for kid-friendly words later.
- `buildSentence(map, emojis)` maps each emoji through `lookupLabel` and joins
  with `", "`. Empty input returns the empty string.

Order matters in `lookupLabel`: skin-tone stripping is last, so an emoji whose
own label mentions a tone still wins on the exact match.

### `src/useSpeech.ts`

Wraps the Web Speech API.

- `isSupported` - `"speechSynthesis" in window`.
- Voice selection: filter `getVoices()` to voices whose `lang` starts with
  `en`; within those, prefer the first match against the name patterns
  `/samantha/i, /ava/i, /victoria/i, /karen/i, /moira/i, /allison/i, /zira/i,
  /female/i, /woman/i`; otherwise take the first available voice.
- `getVoices()` returns an empty array on first call in some browsers. Subscribe
  to the `voiceschanged` event and re-resolve the voice when it fires.
- `speak(text)` - no-op on empty text. Otherwise `cancel()` then `speak()` a new
  utterance with the chosen voice, `rate = 1.05`, `pitch = 1.55`, `volume = 1`,
  `lang = "en-US"`.
- The `cancel()` before each `speak()` means a fast-tapping child hears the
  newest word rather than a growing backlog. This is deliberate.

### `src/Composer.tsx`

Presentational. Props: `emojis: string[]`, `onPlay`, `onBackspace`, `onClear`,
`canSpeak: boolean`. Renders the strip and the button row. Play, Backspace and
Clear are disabled when the strip is empty. Play is hidden entirely when
`canSpeak` is false.

### `src/App.tsx`

Owns `emojis: string[]` state and wires everything.

- `handleSelect(emoji)` appends to `emojis` and calls `speak(lookupLabel(...))`.
- `handlePlay()` calls `speak(buildSentence(map, emojis))`.
- `handleBackspace()` drops the last element.
- `handleClear()` empties the array.
- The label map is built once with `useMemo`.

## Data flow

```
tap emoji ──> append to emojis[] ──> speak(one label)
Play      ──> buildSentence(emojis) ──> speak(whole sentence)
Backspace ──> emojis.slice(0, -1)
Clear     ──> []
```

## Error handling

- No `speechSynthesis` on the device: `canSpeak` is false, Play is hidden, and a
  one-line note explains that this device has no voice. Everything else still
  works.
- Voices not yet loaded: the `voiceschanged` subscription re-resolves. If a
  `speak` happens before any voice resolves, the utterance goes out with no
  explicit voice and the browser default is used. This is acceptable.
- Unknown emoji: `lookupLabel` returns `"symbol"`.
- iOS requires the first utterance to originate inside a user gesture. Every
  `speak` in this app is called from a tap handler, so this is satisfied by
  construction. No separate unlock step is needed.

## Testing

Vitest, no browser needed.

`labels.test.ts`:

- Plain emoji resolves to its label (`🐶` -> `dog face`).
- Emoji carrying a variation selector resolves (`❤️`).
- Skin-toned emoji falls back to the base emoji's label (`👍🏽` -> `thumbs up`).
- Multi-part ZWJ emoji resolves (`👨‍👩‍👧`).
- Unknown input returns `"symbol"`.
- An entry in `overrides` beats the emojibase label.
- `buildSentence` joins in tap order with `", "`, and returns `""` for `[]`.

`useSpeech.test.ts` with a stubbed `window.speechSynthesis`:

- `speak` calls `cancel` then `speak` exactly once.
- Utterance carries the configured rate and pitch.
- Empty text produces no call.
- Voice preference picks a matching name over a non-matching one.
- `isSupported` is false when `speechSynthesis` is absent.

`App.test.tsx`:

- Play speaks once, with all words joined, not once per emoji.

## Git

Work happens on `feature/emoji-sentence-composer`, branched from the repo's
existing head. The remote is SSH.
