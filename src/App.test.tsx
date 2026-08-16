import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const spoken: string[] = []
const sequences: string[][] = []
let stopCount = 0
let speakingIndex: number | null = null
let spokenText: string | null = null
let clearWordCount = 0

vi.mock('./useSpeech', () => ({
  useSpeech: () => ({
    isSupported: true,
    speakingIndex,
    spokenText,
    speak: (text: string) => {
      spoken.push(text)
    },
    speakSequence: (words: string[]) => {
      sequences.push(words)
    },
    stop: () => {
      stopCount += 1
    },
    clearWord: () => {
      clearWordCount += 1
    },
  }),
}))

// The real picker is a custom element with a shadow root and does not render
// meaningfully in jsdom, so stand in two buttons that fire the same callback.
vi.mock('./EmojiPicker', () => ({
  default: ({
    onEmojiSelect,
  }: {
    onEmojiSelect: (e: { native: string }) => void
  }) => (
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

import App from './App'

describe('App', () => {
  beforeEach(() => {
    spoken.length = 0
    sequences.length = 0
    stopCount = 0
    speakingIndex = null
    spokenText = null
    clearWordCount = 0
  })

  it('speaks each emoji as it is tapped', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('pick dog'))
    await userEvent.click(screen.getByText('pick apple'))
    expect(spoken).toEqual(['dog', 'red apple'])
  })

  it('adds tapped emoji to the strip', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('pick dog'))
    await userEvent.click(screen.getByText('pick apple'))
    expect(screen.getByTestId('strip').textContent).toBe('🐶🍎')
  })

  it('reads every word in tap order when Play is pressed', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('pick dog'))
    await userEvent.click(screen.getByText('pick apple'))
    await userEvent.click(screen.getByRole('button', { name: /play/i }))
    expect(sequences).toEqual([['dog', 'red apple']])
  })

  it('highlights the emoji being read', async () => {
    speakingIndex = 1
    render(<App />)
    await userEvent.click(screen.getByText('pick dog'))
    await userEvent.click(screen.getByText('pick apple'))
    const shown = screen.getAllByTestId('composer-emoji')
    expect(shown[1]).toHaveClass('is-speaking')
  })

  it('Stop silences the reading', async () => {
    speakingIndex = 0
    render(<App />)
    await userEvent.click(screen.getByText('pick dog'))
    await userEvent.click(screen.getByRole('button', { name: /stop/i }))
    expect(stopCount).toBe(1)
  })

  it('clearing the strip also silences the reading', async () => {
    speakingIndex = 0
    render(<App />)
    await userEvent.click(screen.getByText('pick dog'))
    await userEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(stopCount).toBe(1)
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

describe('App header', () => {
  beforeEach(() => {
    spoken.length = 0
    sequences.length = 0
    stopCount = 0
    speakingIndex = null
    spokenText = null
    clearWordCount = 0
  })

  it('shows the word that is being spoken', () => {
    spokenText = 'red apple'
    render(<App />)
    expect(screen.getByTestId('spoken-word')).toHaveTextContent('red apple')
  })

  it('shows no word when silent', () => {
    render(<App />)
    expect(screen.getByTestId('spoken-word').textContent?.trim()).toBe('')
  })
})

describe('App clearing', () => {
  beforeEach(() => {
    spoken.length = 0
    sequences.length = 0
    stopCount = 0
    speakingIndex = null
    spokenText = null
    clearWordCount = 0
  })

  it('Clear wipes the word as well as the strip', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('pick dog'))
    await userEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(clearWordCount).toBe(1)
  })

  it('Undo leaves the word alone', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('pick dog'))
    await userEvent.click(screen.getByRole('button', { name: /undo/i }))
    expect(clearWordCount).toBe(0)
  })
})
