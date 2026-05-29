export function HeartIcon({ size = 34 }) {
  return (
    <svg
      aria-hidden="true"
      className="heart-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" />
    </svg>
  )
}

export function ShareIcon() {
  return (
    <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 1.06 2.29l-7.16 4.18A3 3 0 0 0 6 9a3 3 0 1 0 2.9 3.75l7.2 4.2A3 3 0 1 0 18 16a2.96 2.96 0 0 0-1.43.37l-7.2-4.2A3.2 3.2 0 0 0 9.4 12c0-.16-.01-.31-.04-.46l7.17-4.18A2.96 2.96 0 0 0 18 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function InstagramIcon() {
  return (
    <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="16.9" cy="7.1" r="1.1" fill="currentColor" />
    </svg>
  )
}

export function AmbientIcon({ type }) {
  if (type === 'rain') {
    return (
      <svg aria-hidden="true" viewBox="0 0 48 48" className="ambient-icon">
        <path
          d="M24 5C18 14 13 22 13 29.5 13 36.3 17.9 42 24 42s11-5.7 11-12.5C35 22 30 14 24 5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.6"
          strokeLinejoin="round"
        />
        <path d="M20 31.5c1 2.5 2.7 3.8 5.2 3.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3.2" />
      </svg>
    )
  }

  if (type === 'waves') {
    return (
      <svg aria-hidden="true" viewBox="0 0 48 48" className="ambient-icon">
        <path
          d="M5 19c4.7 0 4.7-4 9.4-4s4.7 4 9.4 4 4.8-4 9.5-4 4.8 4 9.7 4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3.6"
        />
        <path
          d="M5 29c4.7 0 4.7-4 9.4-4s4.7 4 9.4 4 4.8-4 9.5-4 4.8 4 9.7 4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3.6"
        />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="ambient-icon">
      <path
        d="M25.8 4.5c1.4 8.2-5 10.3-5 16 0 2.2 1.2 3.9 3.2 4.9-.6-5.2 4.2-8.3 4.6-13 6.1 4.5 9.4 10.2 9.4 16.4C38 37 31.9 43 24 43S10 37 10 29.3c0-5.9 3.4-11.4 8.6-15.4-.2 4.4 2.7 7 5.1 7.8-1.7-6.1.3-11.7 2.1-17.2Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3.4"
      />
    </svg>
  )
}

export function CopyIcon() {
  return (
    <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 9h10v10H9V9ZM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DownloadIcon() {
  return (
    <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
