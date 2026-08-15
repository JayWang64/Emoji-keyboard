# Emoji Keyboard

A talking emoji keyboard for young children.

- Tap an emoji and it is spoken out loud straight away.
- Taps collect in a box at the top. The box is a fixed height and never grows:
  the emojis shrink as it fills, so the keyboard below never shifts.
- Press **Play** and the whole strip is read out, one emoji at a time. The
  emoji being read lights up and a bar shows how far along it is.
- While it is reading, Play turns into **Stop**.
- **Undo** removes the last emoji. **Clear** empties the strip.

## Running it

    npm install
    npm run dev

Then open the address the terminal prints.

## Testing

    npm test

## How the voice works

The browser's built-in Web Speech API does the talking. There is no server, no
account and no API key. Voice quality depends on the device.

The app prefers a female-sounding English voice, and speaks slightly fast and
noticeably high so it sounds bright rather than robotic.

## How the words are chosen

Every emoji's word comes from [`emojibase-data`](https://github.com/milesj/emojibase),
which carries the official CLDR label for each emoji, such as "red apple" or
"dog face". Nothing is hand-typed.

To use friendlier words, add entries to `overrides` in `src/labels.ts`:

    export const overrides: Record<string, string> = {
      '🐶': 'doggy',
      '🚗': 'car',
    }

An override always wins over the official label.

## Design docs

- Spec: `docs/superpowers/specs/2026-08-15-emoji-sentence-composer-design.md`
- Plan: `docs/superpowers/plans/2026-08-15-emoji-sentence-composer.md`
