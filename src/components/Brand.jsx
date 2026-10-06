export function SellDeskWordmark({
  variant = 'accent',
  className = '',
  title = 'SellDesk',
}) {
  const isLight = variant === 'light'
  const deskFill = variant === 'mono' || isLight ? 'currentColor' : '#3B82F6'

  return (
    <svg
      className={`brand-wordmark brand-wordmark--${variant} ${className}`}
      viewBox="0 0 188 42"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="none" fillRule="evenodd">
        <text
          x="0"
          y="31"
          fill={isLight ? '#F7F7F7' : '#111111'}
          fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="32"
          fontWeight="760"
          letterSpacing="-1.15"
        >
          Sell
        </text>
        <text
          x="62"
          y="31"
          fill={deskFill}
          fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="32"
          fontWeight="760"
          letterSpacing="-1.15"
        >
          desk
        </text>
      </g>
    </svg>
  )
}

export function SDMark({
  variant = 'blue',
  className = '',
  title = 'SellDesk compact mark',
}) {
  const blue = variant === 'light' ? '#F7F7F7' : '#3B82F6'
  const dark = variant === 'light' ? '#F7F7F7' : '#111111'

  return (
    <svg
      className={`brand-mark brand-mark--${variant} ${className}`}
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <text
        x="5.5"
        y="33"
        fill={dark}
        fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="26"
        fontWeight="800"
        letterSpacing="-3"
      >
        S
      </text>
      <text
        x="20"
        y="33"
        fill={blue}
        fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="26"
        fontWeight="800"
        letterSpacing="-3"
      >
        D
      </text>
      <path d="M8 38H38" stroke={blue} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </svg>
  )
}
