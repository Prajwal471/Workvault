import { SealMark } from "./landing/SealMark";

interface LogoProps {
  size?: number;
  tagline?: string;
  variant?: "dark" | "brand";
}

const MONOGRAM = "M12 18L22 46L32 30L42 46L52 18H44L38 34L32 24L26 34L20 18H12Z";
const DIAMOND = "M32 20L39 28L32 36L25 28L32 20Z";
const KEYHOLE = "M30.8 28.5H33.2L33.7 32H30.3L30.8 28.5Z";

export function Logo({ size = 48, tagline, variant = "dark" }: LogoProps) {
  if (variant === "brand") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SealMark size={size} />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span
            className="landing-serif"
            style={{
              fontWeight: 600,
              fontSize: size * 0.8,
              color: "var(--green)",
              letterSpacing: "-0.01em",
            }}
          >
            WorkVault
          </span>
          {tagline && (
            <span
              className="ledger-mono"
              style={{
                fontSize: 10,
                color: "var(--brown)",
                letterSpacing: "0.12em",
                marginTop: 4,
                textTransform: "uppercase",
              }}
            >
              {tagline}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.29),
          background: "#09090B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 24px rgba(28,51,40,0.35)",
          flexShrink: 0,
        }}
      >
        <svg width={size * 0.82} height={size * 0.82} viewBox="0 0 64 64" fill="none" aria-hidden>
          <path d={MONOGRAM} fill="#7FBF9D" />
          <path d={DIAMOND} fill="#09090B" />
          <circle cx="32" cy="26.5" r="2" fill="#7FBF9D" />
          <path d={KEYHOLE} fill="#7FBF9D" />
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontWeight: 800,
            fontSize: 24,
            color: "#fff",
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-display)",
          }}
        >
          WorkVault
        </span>
        {tagline && (
          <span
            style={{
              fontWeight: 600,
              fontSize: 10,
              color: "#7FBF9D",
              letterSpacing: "0.15em",
              marginTop: 3,
            }}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
}
