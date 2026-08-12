interface SealMarkProps {
  size?: number;
}

/**
 * The wax-seal stamp: a checkmark inside a double ring, deep forest green.
 * Marks completed milestones across the ledger.
 */
export function SealMark({ size = 40 }: SealMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="29" fill="#EFE9DC" stroke="#1C3328" strokeWidth="3" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="#1C3328" strokeWidth="1.5" />
      <path
        d="M21 33l8 8 15-17"
        stroke="#1C3328"
        strokeWidth="4.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
    </svg>
  );
}
