import { SealMark } from "./SealMark";

/**
 * Static hero visual: a bank-passbook style vault card caught mid-flow.
 * Lock + Submit complete (sealed), Approve in progress, Release pending.
 */
export function VaultPassbookCard() {
  const rows: {
    stage: string;
    detail: string;
    state: "done" | "current" | "pending";
  }[] = [
    { stage: "Lock", detail: "500.0000 XLM held in escrow", state: "done" },
    { stage: "Submit", detail: "Proof of work linked on-chain", state: "done" },
    { stage: "Approve", detail: "Awaiting client approval", state: "current" },
    { stage: "Release", detail: "Funds out in seconds", state: "pending" },
  ];

  return (
    <div
      id="passbook-card"
      style={{
        width: "100%",
        maxWidth: 400,
        borderRadius: 16,
        background: "#EFE9DC",
        border: "1px solid #C9BEA8",
        overflow: "hidden",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header strip */}
      <div
        style={{
          background: "#1A2E26",
          color: "#F4EFE6",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em" }}>
          WORKVAULT · PASSBOOK
        </span>
        <span
          className="ledger-mono"
          style={{ color: "#F4EFE6", fontSize: 12, letterSpacing: "0.04em" }}
        >
          Vault #0004
        </span>
      </div>

      {/* Ledger rows */}
      <div style={{ padding: "6px 18px" }}>
        {rows.map((r) => (
          <div
            key={r.stage}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 0",
              borderBottom: "1px solid #DCD3C1",
            }}
          >
            {/* Stage glyph */}
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  r.state === "done"
                    ? "#1C3328"
                    : r.state === "current"
                      ? "#EFE9DC"
                      : "transparent",
                border:
                  r.state === "pending" ? "1.5px solid #C9BEA8"
                  : r.state === "current" ? "2px solid #3E2F21"
                  : "none",
              }}
            >
              {r.state === "done" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 12l5 5L20 6" stroke="#F4EFE6" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>
              )}
              {r.state === "current" && (
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3E2F21" }} />
              )}
              {r.state === "pending" && (
                <span style={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #C9BEA8" }} />
              )}
            </span>

            {/* Stage label + detail */}
            <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: r.state === "pending" ? "#5E564B" : "#201C17",
                }}
              >
                {r.stage}
              </span>
              <span
                className="ledger-mono"
                style={{
                  fontSize: 11,
                  color: r.state === "pending" ? "#8a8172" : "#5E564B",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.detail}
              </span>
            </span>

            {r.state === "current" && (
              <span
                className="ledger-mono"
                style={{ fontSize: 10, color: "#3E2F21", letterSpacing: "0.08em", flexShrink: 0 }}
              >
                ● NOW
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Parties + sealed completion */}
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
        <SealMark size={44} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span className="ledger-mono" style={{ fontSize: 11, color: "#3E2F21" }}>CLIENT</span>
            <span className="ledger-mono" style={{ fontSize: 11, color: "#5E564B" }}>GBV2…K9QN</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span className="ledger-mono" style={{ fontSize: 11, color: "#3E2F21" }}>FREELANCER</span>
            <span className="ledger-mono" style={{ fontSize: 11, color: "#5E564B" }}>GDE7…P3XM</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span className="ledger-mono" style={{ fontSize: 11, color: "#3E2F21" }}>STATUS</span>
            <span className="ledger-mono" style={{ fontSize: 11, color: "#1C3328", fontWeight: 700 }}>IN REVIEW</span>
          </div>
        </div>
      </div>
    </div>
  );
}
