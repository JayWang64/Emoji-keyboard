import { describe, it, expect, beforeEach, vi } from 'vitest'
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
