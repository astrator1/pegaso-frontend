import React from "react";

export function Drone({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="10" width="4" height="4" rx="1" />
      <line x1="10" y1="10" x2="5" y2="5" />
      <line x1="14" y1="10" x2="19" y2="5" />
      <line x1="10" y1="14" x2="5" y2="19" />
      <line x1="14" y1="14" x2="19" y2="19" />
      <circle cx="5" cy="5" r="2.5" />
      <circle cx="19" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
    </svg>
  );
}