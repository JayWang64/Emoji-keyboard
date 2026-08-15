import { cleanup, render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Header from './Header'

describe('Header', () => {
  it('shows the word being spoken', () => {
    render(<Header word="red apple" />)
    expect(screen.getByTestId('spoken-word')).toHaveTextContent('red apple')
  })

  it('shows nothing when silent', () => {
    render(<Header word={null} />)
    expect(screen.getByTestId('spoken-word').textContent?.trim()).toBe('')
  })

  it('keeps the word slot in place when silent, so nothing jumps', () => {
    render(<Header word="red apple" />)
    const loud = screen.getByTestId('spoken-word').className
    cleanup()
    render(<Header word={null} />)
    expect(screen.getByTestId('spoken-word')).toBeInTheDocument()
    expect(screen.getByTestId('spoken-word').className).toBe(loud)
  })

  it('keeps the app name on the page', () => {
    render(<Header word={null} />)
    expect(screen.getByText('Emoji Keyboard')).toBeInTheDocument()
  })

  it('announces the word politely for screen readers', () => {
    render(<Header word="potato" />)
    expect(screen.getByTestId('spoken-word')).toHaveAttribute('aria-live', 'polite')
  })
})
