import type { HTMLAttributes } from 'react'

// Maps Tailwind h-X classes → font-size so FA glyphs fill the intended size.
const SIZE_MAP: Record<string, string> = {
  'h-3': '0.75rem',
  'h-3.5': '0.875rem',
  'h-4': '1rem',
  'h-4.5': '1.125rem',
  'h-5': '1.25rem',
  'h-6': '1.5rem',
  'h-7': '1.75rem',
  'h-8': '2rem',
  'h-9': '2.25rem',
  'h-10': '2.5rem',
}

export type FaVariant = 'solid' | 'thin' | 'regular' | 'light'

export interface FaIconProps extends HTMLAttributes<HTMLElement> {
  variant?: FaVariant
}

export function createFaIcon(iconName: string, defaultVariant: FaVariant = 'solid') {
  function FaIconComponent({ className, style, variant = defaultVariant, ...props }: FaIconProps) {
    const sizeClass = className?.split(' ').find((c) => c.startsWith('h-'))
    const fontSize = sizeClass ? SIZE_MAP[sizeClass] : undefined

    return (
      <i
        className={`fa-${variant} fa-${iconName}${className ? ` ${className}` : ''}`}
        style={{ fontSize, lineHeight: 1, ...style }}
        aria-hidden="true"
        {...props}
      />
    )
  }
  FaIconComponent.displayName = iconName
  return FaIconComponent
}
