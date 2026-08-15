import { useEffect, useRef } from 'react'
import data from '@emoji-mart/data'
import { Picker } from 'emoji-mart'

export type EmojiPickerProps = {
  onEmojiSelect: (emoji: { native?: string }) => void
}

/**
 * Mounts the emoji-mart picker, which is a custom element rather than a React
 * component. The official @emoji-mart/react wrapper still pins React 18, so we
 * do the same few lines ourselves and skip the dependency.
 */
export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const host = useRef<HTMLDivElement>(null)
  // Kept in a ref so the picker is built once, not rebuilt on every render.
  const handler = useRef(onEmojiSelect)
  handler.current = onEmojiSelect

  useEffect(() => {
    const container = host.current
    if (!container) return

    const picker = new Picker({
      data,
      onEmojiSelect: (emoji: { native?: string }) => handler.current(emoji),
      previewPosition: 'none',
      skinTonePosition: 'search',
      navPosition: 'top',
      maxFrequentRows: 1,
      emojiSize: 32,
      emojiButtonSize: 44,
      dynamicWidth: true,
    }) as unknown as HTMLElement

    container.appendChild(picker)
    return () => {
      container.removeChild(picker)
    }
  }, [])

  return <div className="emoji-picker-host" ref={host} />
}
