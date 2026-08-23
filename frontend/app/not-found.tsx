import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        maxWidth: 440, width: "100%",
        borderRadius: 20, padding: "clamp(24px, 5vw, 40px)",
        border: "1px solid var(--cream-line)", background: "var(--paper)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "var(--cream-soft)", border: "1px solid var(--cream-line)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 700, color: "var(--muted)",
        }}>
          404
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", margin: 0, fontFamily: "var(--font-display)" }}>
          Page not found
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" style={{ textDecoration: "none" }}>
          <button
            style={{
              marginTop: 8,
              background: "var(--green)", color: "var(--brand-cream)",
              border: "1px solid var(--green-deep)", borderRadius: 10,
              padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            Back to home
          </button>
        </Link>
      </div>
    </div>
  );
}
