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
