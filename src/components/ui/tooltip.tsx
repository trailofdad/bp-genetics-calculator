import { useState, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string
  children: ReactNode
  side?: 'top' | 'bottom'
}

/**
 * Instant tooltip rendered via a portal — escapes overflow:hidden and any
 * stacking context. Shows immediately on hover with no delay.
 */
export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)

  function show() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setCoords({
      top: side === 'top'
        ? rect.top + window.scrollY
        : rect.bottom + window.scrollY,
      left: rect.left + window.scrollX + rect.width / 2,
    })
    setVisible(true)
  }

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={show}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && createPortal(
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            transform: side === 'top'
              ? 'translate(-50%, calc(-100% - 8px))'
              : 'translate(-50%, 8px)',
            zIndex: 99999,
          }}
          className="pointer-events-none w-max max-w-[200px] rounded-lg border border-border bg-popover px-2.5 py-1.5 text-center text-[11px] leading-snug text-popover-foreground shadow-lg"
        >
          {content}
        </span>,
        document.body
      )}
    </span>
  )
}
