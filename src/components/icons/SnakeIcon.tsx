import type { SVGProps } from 'react'

export function SnakeIcon({
  className,
  strokeWidth = 2,
  ...props
}: SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* S-curve body */}
      <path d="M17 20c2 0 3-1 3-3s-1-3-3-3H7c-2 0-3-1-3-3s1-3 3-3h9" />
      {/* Head */}
      <circle cx="17" cy="8" r="2" />
      {/* Tongue */}
      <path d="M17 6V4" />
      <path d="M15.5 3l1.5 1 1.5-1" />
    </svg>
  )
}
