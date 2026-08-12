interface BrandMarkProps {
  width?: number;
}

/**
 * The WorkVault brand lockup — dark-green tile with a wax-seal ring and
 * checkmark, plus the serif wordmark. Matches the brand SVG.
 */
export function BrandMark({ width = 200 }: BrandMarkProps) {
  const height = Math.round((width * 180) / 340);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 340 180"
      width={width}
      height={height}
      role="img"
      aria-label="WorkVault"
    >
      <rect width="340" height="180" rx="16" fill="#1A2E26" />
      <g transform="translate(15, 45)">
        <circle cx="45" cy="45" r="39" fill="none" stroke="#F4EFE6" strokeWidth="4.5" />
        <circle cx="45" cy="11.5" r="3" fill="#6A3E26" />
        <path
          d="M 25 45 L 41 61 L 65 29"
          fill="none"
          stroke="#F4EFE6"
          strokeWidth="8.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <text
          x="100"
          y="57"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 40,
            fontWeight: 500,
            fill: "#F4EFE6",
          }}
        >
          WorkVault
        </text>
      </g>
    </svg>
  );
}
