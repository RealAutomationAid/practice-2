import React from 'react'

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export function Logo({ className = '', width = 32, height = 32 }: LogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blue arrow/chevron pointing right */}
      <path
        d="M15 25 L35 50 L15 75 L25 75 L50 50 L25 25 Z"
        fill="#00BFFF"
      />
      
      {/* Green triangle/mountain */}
      <path
        d="M45 15 L75 75 L35 75 Z"
        fill="#00E676"
      />
    </svg>
  )
} 