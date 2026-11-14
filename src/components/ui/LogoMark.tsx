import React from 'react';

interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className = 'h-9 w-9' }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dm-shield" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#dm-shield)" />
      <path
        d="M12.5 13.5H20.5C24.366 13.5 27.5 16.634 27.5 20.5C27.5 24.366 24.366 27.5 20.5 27.5H12.5V13.5Z"
        stroke="white"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M17 20.5L19.5 23L24 18"
        stroke="#A7F3D0"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
