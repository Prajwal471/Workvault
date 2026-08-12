"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchVaultEvents, VaultEvent, VaultEventType } from "@/lib/events";
import { useWallet } from "@/context/WalletContext";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon, IconName } from "@/components/ui/Icon";

const POLL_MS = 6000;

const EVENT_META: Record<VaultEventType, { icon: IconName; label: string; color: string; bg: string; border: string }> = {
  created:  { icon: "sparkle", label: "Vault Created",    color: "#3e2f21", bg: "#f7f3ea", border: "#dcd3c1" },
  funded:   { icon: "deposit", label: "Funds Deposited",  color: "var(--green)", bg: "#e7f2ec", border: "rgba(28,51,40,0.3)" },
  review:   { icon: "file",    label: "In Review",        color: "#8a5c1f", bg: "#fbf3e0", border: "#d9bc7a" },
  done:     { icon: "release", label: "Funds Released",   color: "#0f1f18", bg: "#e7f2ec", border: "rgba(15,31,24,0.35)" },
  cancel:   { icon: "x",       label: "Vault Cancelled",  color: "#8a3a2a", bg: "#fbf3f0", border: "#e3c7c0" },
  unknown:  { icon: "sparkle", label: "Event",            color: "var(--muted)", bg: "var(--cream-soft)", border: "var(--cream-line)" },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5)   return "just now";
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

interface ActivityFeedProps {
  /** When provided, event rows become clickable and call back with the vault id. */
  onOpenVault?: (vaultId: string) => void;
  /** Highlight only events touching this address when the Mine filter is active. */
  highlightKey?: string;
}

type Filter = "all" | "mine";

export function ActivityFeed({ onOpenVault, highlightKey }: ActivityFeedProps) {
  const { wallet } = useWallet();
  const [events, setEvents]     = useState<VaultEvent[]>([]);
  const [filter, setFilter]     = useState<Filter>("all");
  const [isLive, setIsLive]     = useState(true);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);
  const [newIds, setNewIds]     = useState<Set<string>>(new Set());
  const seenIds                 = useRef<Set<string>>(new Set());
  const listRef                 = useRef<HTMLDivElement>(null);

  const poll = async () => {
    const fetched = await fetchVaultEvents();
    if (fetched.length === 0) { setLastPoll(new Date()); return; }

    const fresh = fetched.filter(e => !seenIds.current.has(e.id));
    if (fresh.length === 0) { setLastPoll(new Date()); return; }

    fresh.forEach(e => seenIds.current.add(e.id));
    const freshIds = new Set(fresh.map(e => e.id));
    setNewIds(freshIds);
    setTimeout(() => setNewIds(new Set()), 3000); // clear highlight after 3s

    setEvents(prev => {
      const merged = [...fresh, ...prev].slice(0, 40); // keep last 40
      return merged;
    });
    setLastPoll(new Date());

    // Scroll to top on new events
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myKey = highlightKey ?? wallet?.publicKey ?? "";

  const visible = useMemo(() => {
    if (filter === "all" || !myKey) return events;
    return events.filter(e => e.rawValue.includes(myKey) || e.rawTopics.some(t => {
      try {
        return Buffer.from(t, "base64").toString().includes(myKey);
      } catch {
        return false;
      }
    }));
  }, [events, filter, myKey]);

  return (
    <Card id="activity-feed" style={{ padding: 0, overflow: "hidden" }}>
      <CardHeader
        icon={<Icon name="bolt" size={18} />}
        accent="var(--green)"
        title="Activity Feed"
        subtitle="last 200 ledgers"
        style={{ padding: "18px 24px" }}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {lastPoll && (
              <span className="ledger-mono" style={{ fontSize: 11, color: "var(--muted-soft)" }}>
                updated {timeAgo(lastPoll.toISOString())}
              </span>
            )}
            {/* All / Mine filter */}
            {myKey && (
              <div style={{ display: "flex", background: "var(--cream-soft)", border: "1px solid var(--cream-line)", borderRadius: 999, padding: 2 }}>
                {(["all", "mine"] as Filter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      background: filter === f ? "var(--green)" : "transparent",
                      border: "none", borderRadius: 999, padding: "5px 12px",
                      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                      color: filter === f ? "var(--brand-cream)" : "var(--muted)",
                      cursor: "pointer",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    {f === "all" ? "All" : "Mine"}
                  </button>
                ))}
              </div>
            )}
            {/* Pulsing live badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "var(--green)",
                boxShadow: "0 0 0 0 rgba(28,51,40,0.6)",
                animation: "pulse 2s infinite",
                display: "inline-block",
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", letterSpacing: "0.08em" }}>LIVE</span>
            </div>
          </div>
        }
      />

      {/* Event list */}
      <div ref={listRef} style={{ maxHeight: 340, overflowY: "auto", padding: "8px 0" }}>
        {visible.length === 0 ? (
          <div style={{
            padding: "32px 24px", textAlign: "center",
            color: "var(--muted)", fontSize: 13,
          }}>
            <div style={{ fontSize: 22, marginBottom: 8, opacity: 0.4 }}>
              <Icon name="pulse" size={22} color="var(--muted-soft)" />
            </div>
            {filter === "mine" ? "No events for your address yet" : "No events yet — create a vault to see activity here"}
          </div>
        ) : (
          visible.map((ev) => {
            const meta = EVENT_META[ev.type];
            const isNew = newIds.has(ev.id);
            const row = (
              <>
                {/* Icon */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: meta.bg, border: `1px solid ${meta.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name={meta.icon} size={14} color={meta.color} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{meta.label}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                      background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color,
                    }}>
                      Vault #{ev.vaultId}
                    </span>
                    {isNew && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 999,
                        background: "var(--green)", color: "var(--brand-cream)", letterSpacing: "0.08em",
                      }}>NEW</span>
                    )}
                  </div>
                  <div className="ledger-mono" style={{ fontSize: 11, color: "var(--muted-soft)", marginTop: 2 }}>
                    Ledger {ev.ledger.toLocaleString()} · {timeAgo(ev.ledgerClosedAt)}
                  </div>
                </div>

                {/* Ledger link */}
                <a
                  href={`https://stellar.expert/explorer/testnet/ledger/${ev.ledger}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ fontSize: 11, color: "var(--muted)", textDecoration: "none", flexShrink: 0 }}
                  title="View ledger on Stellar Expert"
                  aria-label={`Open ledger ${ev.ledger} on Stellar Expert`}
                >
                  <Icon name="external" size={13} color="var(--muted-soft)" />
                </a>
              </>
            );

            return onOpenVault ? (
              <button
                key={ev.id}
                onClick={() => onOpenVault(ev.vaultId)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  width: "100%", textAlign: "left",
                  padding: "10px 24px",
                  background: isNew ? "rgba(28,51,40,0.05)" : "transparent",
                  border: "none", borderLeft: isNew ? "2px solid var(--green)" : "2px solid transparent",
                  borderBottom: "1px solid rgba(201,190,168,0.25)",
                  cursor: "pointer",
                  transition: "background 0.4s, border-color 0.4s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--cream-soft)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isNew ? "rgba(28,51,40,0.05)" : "transparent"; }}
              >
                {row}
              </button>
            ) : (
              <div
                key={ev.id}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "10px 24px",
                  background: isNew ? "rgba(28,51,40,0.05)" : "transparent",
                  borderLeft: isNew ? "2px solid var(--green)" : "2px solid transparent",
                  transition: "background 0.4s, border-color 0.4s",
                }}
              >
                {row}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
