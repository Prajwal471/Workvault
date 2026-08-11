"use client";

import React, { useEffect, useRef, useState } from "react";
import { fetchVaultEvents, VaultEvent, VaultEventType } from "@/lib/events";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon, IconName } from "@/components/ui/Icon";

const POLL_MS = 6000;

const EVENT_META: Record<VaultEventType, { icon: IconName; label: string; color: string; bg: string; border: string }> = {
  created:  { icon: "sparkle", label: "Vault Created",    color: "#c084fc", bg: "rgba(168,85,247,0.1)",  border: "rgba(168,85,247,0.25)" },
  funded:   { icon: "deposit", label: "Funds Deposited",  color: "#4ade80", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)"   },
  review:   { icon: "file",    label: "In Review",        color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)"  },
  done:     { icon: "release", label: "Funds Released",   color: "#22d3ee", bg: "rgba(34,211,238,0.08)",  border: "rgba(34,211,238,0.2)"  },
  cancel:   { icon: "x",       label: "Vault Cancelled",  color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
  unknown:  { icon: "sparkle", label: "Event",            color: "#8b85a0", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)" },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5)   return "just now";
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function ActivityFeed() {
  const [events, setEvents]     = useState<VaultEvent[]>([]);
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

  return (
    <Card id="activity-feed" style={{ padding: 0, overflow: "hidden" }}>
      <CardHeader
        icon={<Icon name="bolt" size={18} />}
        accent="#a855f7"
        title="Activity Feed"
        subtitle="last 200 ledgers"
        style={{ padding: "18px 24px" }}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {lastPoll && (
              <span style={{ fontSize: 11, color: "#5b5670" }}>
                updated {timeAgo(lastPoll.toISOString())}
              </span>
            )}
            {/* Pulsing live badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 0 0 rgba(74,222,128,0.6)",
                animation: "pulse 2s infinite",
                display: "inline-block",
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", letterSpacing: "0.08em" }}>LIVE</span>
            </div>
          </div>
        }
      />

      {/* Event list */}
      <div ref={listRef} style={{ maxHeight: 340, overflowY: "auto", padding: "8px 0" }}>
        {events.length === 0 ? (
          <div style={{
            padding: "32px 24px", textAlign: "center",
            color: "#334155", fontSize: 13,
          }}>
            <div style={{ fontSize: 22, marginBottom: 8, opacity: 0.4 }}>
              <Icon name="pulse" size={22} color="#8b85a0" />
            </div>
            No events yet — create a vault to see activity here
          </div>
        ) : (
          events.map((ev) => {
            const meta = EVENT_META[ev.type];
            const isNew = newIds.has(ev.id);
            return (
              <div
                key={ev.id}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "10px 24px",
                  background: isNew ? "rgba(168,85,247,0.07)" : "transparent",
                  borderLeft: isNew ? "2px solid #a855f7" : "2px solid transparent",
                  transition: "background 0.4s, border-color 0.4s",
                }}
              >
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{meta.label}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                      background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color,
                    }}>
                      Vault #{ev.vaultId}
                    </span>
                    {isNew && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 999,
                        background: "rgba(168,85,247,0.2)", color: "#c084fc", letterSpacing: "0.08em",
                      }}>NEW</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#454156", marginTop: 2 }}>
                    Ledger {ev.ledger.toLocaleString()} · {timeAgo(ev.ledgerClosedAt)}
                  </div>
                </div>

                {/* Ledger link */}
                <a
                  href={`https://stellar.expert/explorer/testnet/ledger/${ev.ledger}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "#334155", textDecoration: "none", flexShrink: 0 }}
                  title="View ledger on Stellar Expert"
                >
                  <Icon name="external" size={13} color="#8b85a0" />
                </a>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
