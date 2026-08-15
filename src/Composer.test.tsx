import type { ComponentProps } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Composer from './Composer'

const noop = () => {}

function setup(overrides: Partial<ComponentProps<typeof Composer>> = {}) {
  const props = {
    emojis: ['🐶', '🍎'],
    canSpeak: true,
    speakingIndex: null,
    onPlay: noop,
    onStop: noop,
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
    expect(screen.getByTestId('strip').textContent).toBe('🐶🍎')
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

describe('Composer while speaking', () => {
  it('highlights only the emoji being spoken', () => {
    setup({ emojis: ['🐶', '🍎', '😀'], speakingIndex: 1 })
    const spoken = screen.getAllByTestId('composer-emoji')
    expect(spoken[0]).not.toHaveClass('is-speaking')
    expect(spoken[1]).toHaveClass('is-speaking')
    expect(spoken[2]).not.toHaveClass('is-speaking')
  })

  it('highlights nothing when silent', () => {
    setup({ emojis: ['🐶', '🍎'], speakingIndex: null })
    for (const el of screen.getAllByTestId('composer-emoji')) {
      expect(el).not.toHaveClass('is-speaking')
    }
  })

  it('fills the progress bar by how many words are done', () => {
    setup({ emojis: ['🐶', '🍎', '😀', '🥔'], speakingIndex: 1 })
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '2')
    expect(bar).toHaveAttribute('aria-valuemax', '4')
    expect(screen.getByTestId('progress-fill')).toHaveStyle({ width: '50%' })
  })

  it('hides the progress bar when silent', () => {
    setup({ speakingIndex: null })
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('swaps Play for Stop while speaking', () => {
    setup({ speakingIndex: 0 })
    expect(screen.queryByRole('button', { name: /play/i })).toBeNull()
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
  })

  it('calls onStop when Stop is pressed', async () => {
    const onStop = vi.fn()
    setup({ speakingIndex: 0, onStop })
    await userEvent.click(screen.getByRole('button', { name: /stop/i }))
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it('keeps Undo and Clear usable while speaking', () => {
    setup({ speakingIndex: 0 })
    expect(screen.getByRole('button', { name: /undo/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /clear/i })).toBeEnabled()
  })
})
