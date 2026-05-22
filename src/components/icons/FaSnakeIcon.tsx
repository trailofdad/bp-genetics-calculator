import type { HTMLAttributes } from 'react'

// Maps Tailwind h-X classes to font-size values so the FA glyph fills the intended size.
const SIZE_MAP: Record<string, string> = {
  'h-3': '0.75rem',
  'h-3.5': '0.875rem',
  'h-4': '1rem',
  'h-5': '1.25rem',
  'h-6': '1.5rem',
  'h-7': '1.75rem',
  'h-8': '2rem',
  'h-9': '2.25rem',
  'h-10': '2.5rem',
}

interface FaSnakeIconProps extends HTMLAttributes<HTMLElement> {
  variant?: 'solid' | 'thin'
}

export function FaSnakeIcon({ className, style, variant = 'solid', ...props }: FaSnakeIconProps) {
  const sizeClass = className?.split(' ').find((c) => c.startsWith('h-'))
  const fontSize = sizeClass ? SIZE_MAP[sizeClass] : undefined
  const faClass = variant === 'thin' ? 'fa-thin' : 'fa-solid'

  return (
    <i
      className={`${faClass} fa-snake${className ? ` ${className}` : ''}`}
      style={{ fontSize, lineHeight: 1, ...style }}
      aria-hidden="true"
      {...props}
    />
  )
}
