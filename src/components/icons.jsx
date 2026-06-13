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

export function UndoIcon() {
  return (
    <svg aria-hidden="true" width="25" height="25" viewBox="0 0 48 48" fill="none">
      <path
        d="M20 11 8 23l12 12"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 23h18c7 0 11 4.4 11 10.2 0 5.5-4.1 9.8-10 9.8h-7"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ResetIcon() {
  return (
    <svg aria-hidden="true" width="25" height="25" viewBox="0 0 48 48" fill="none">
      <path
        d="M9 21c2-9 10-15 19-14 9.8 1.1 16.8 10 15.6 19.8C42.4 36.5 33.6 43.4 24 42c-4.1-.6-7.7-2.5-10.4-5.3"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 21 4 9m3 12 12-4"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function RotateIcon() {
  return (
    <svg aria-hidden="true" width="25" height="25" viewBox="0 0 48 48" fill="none">
      <path
        d="M37 18A15 15 0 1 0 38 31"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M37 18h-10m10 0V8"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function FlipIcon() {
  return (
    <svg aria-hidden="true" width="25" height="25" viewBox="0 0 48 48" fill="none">
      <path
        d="M7 10v28"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M20 12 8 24l12 12V12Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M28 12 40 24 28 36V12Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M41 10v28"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
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
        d="M29.1 4.8c-9 4.8-14.2 11-14.4 19l-7.1-2.2c-1.8 4.2-2.6 7.9-2.1 11.7C6.4 40.2 12.4 44 20 44h7.4c8.3 0 15.1-6.7 15.1-15 0-5.4-2.4-9.6-7-13.2-5.4-4.2-7.3-7.4-6.4-11Zm-2.4 20.1c-.5 3.5.4 5.8 3.3 8.2 2.2 1.8 3.3 4 3.3 6.5 0 1.5-.4 3-1.1 4.4H20c-4.8 0-8.6-3.8-8.6-8.6 0-2.3.5-4.6 1.6-7l5.5 1.8c-.1-3.2 2.5-6.1 8.2-9.4v4.1Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="round"
        strokeWidth="3.2"
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

export function LogoutIcon() {
  return (
    <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10M14 8l4 4-4 4m4-4H9"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SoundOffIcon() {
  return (
    <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M11 5 6.8 8.5H3.5v7h3.3L11 19V5Zm4.5 4.5 5 5m0-5-5 5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
