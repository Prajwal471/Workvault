"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type UserRole = "client" | "freelancer";

export interface RoleContextValue {
  role: UserRole | null;
  /** True once the initial localStorage check has finished. */
  roleReady: boolean;
  setRole: (role: UserRole) => void;
  clearRole: () => void;
}

const ROLE_KEY = "workvault:role";
const RoleContext = createContext<RoleContextValue | null>(null);

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within <RoleProvider>");
  return ctx;
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [roleReady, setRoleReady] = useState(false);

  useEffect(() => {
    let saved: UserRole | null = null;
    try {
      const raw = localStorage.getItem(ROLE_KEY);
      if (raw === "client" || raw === "freelancer") saved = raw;
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoleState(saved);
    setRoleReady(true);
  }, []);

  const setRole = useCallback((r: UserRole) => {
    setRoleState(r);
    try { localStorage.setItem(ROLE_KEY, r); } catch {}
  }, []);

  const clearRole = useCallback(() => {
    setRoleState(null);
    try { localStorage.removeItem(ROLE_KEY); } catch {}
  }, []);

  return (
    <RoleContext.Provider value={{ role, roleReady, setRole, clearRole }}>
      {children}
    </RoleContext.Provider>
  );
}
