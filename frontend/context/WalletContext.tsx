"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  connectFreighter,
  friendbotFund,
  getConnectedPublicKey,
  isFreighterInstalled,
  signWithFreighter,
} from "@/lib/freighter";
import { connectXBull, isXBullInstalled, signWithXBull } from "@/lib/xbull";
import { connectAlbedo, isAlbedoAvailable, signWithAlbedo } from "@/lib/albedo";
import { connectRabet, isRabetInstalled, signWithRabet } from "@/lib/rabet";
import { fetchXLMBalance } from "@/lib/stellar";

// ── Types ──────────────────────────────────────────────────────────────────

export type WalletProvider = "freighter" | "xbull" | "albedo" | "rabet" | "watch";

export interface ConnectedWallet {
  publicKey: string;
  mode: WalletProvider;
  displayKey: string;
}

export interface SignResult {
  ok: boolean;
  signedXdr?: string;
  error?: string;
}

export interface WalletContextValue {
  wallet: ConnectedWallet | null;
  /** True once the initial auto-reconnect check has finished. */
  walletReady: boolean;
  balance: string;
  /** Rolling samples (last ~30) of XLM balance, one per poll, newest last. */
  balanceHistory: number[];
  networkPassphrase: string;
  isConnecting: boolean;
  isRefreshingBalance: boolean;
  // Per-wallet availability flags
  freighterInstalled: boolean;
  xbullInstalled: boolean;
  albedoAvailable: boolean;
  rabetInstalled: boolean;
  error: string | null;

  // Actions
  connect: () => Promise<void>;
  connectXBullWallet: () => Promise<void>;
  connectAlbedoWallet: () => Promise<void>;
  connectRabetWallet: () => Promise<void>;
  disconnect: () => void;
  watchAddress: (address: string) => void;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
  signTransaction: (xdr: string, networkPassphrase: string) => Promise<SignResult>;
}

// ── Context ────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within <WalletProvider>");
  return ctx;
}

function shortenKey(key: string): string {
  if (key.length < 12) return key;
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

/**
 * Per-tab-session flag: set only when the user explicitly connects in THIS
 * browser session. Auto-reconnect on page load restores the wallet only when
 * this flag is present — so a fresh app start asks to connect, a refresh while
 * connected stays connected, and a disconnect sticks until the user reconnects.
 */
const SESSION_CONNECTED_KEY = "workvault:session-connected";

// ── Provider ───────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet]                     = useState<ConnectedWallet | null>(null);
  const [walletReady, setWalletReady]           = useState(false);
  const [balance, setBalance]                   = useState("0.00");
  const [balanceHistory, setBalanceHistory]     = useState<number[]>([]);
  const [networkPassphrase, setNetworkPassphrase] = useState(
    process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015"
  );
  const [isConnecting, setIsConnecting]         = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [freighterInstalled, setFreighterInstalled] = useState(false);
  const [xbullInstalled, setXbullInstalled]     = useState(false);
  const [albedoAvailable, setAlbedoAvailable]   = useState(false);
  const [rabetInstalled, setRabetInstalled]     = useState(false);
  const [error, setError]                       = useState<string | null>(null);

  // ── Detect wallets on mount ───────────────────────────────────────────────
  useEffect(() => {
    isFreighterInstalled().then(setFreighterInstalled);
    isXBullInstalled().then(setXbullInstalled);
    isAlbedoAvailable().then(setAlbedoAvailable);
    isRabetInstalled().then(setRabetInstalled);
  }, []);

  // ── Auto-reconnect Freighter (only after an explicit connect this session) ─
  useEffect(() => {
    let cancelled = false;
    const hasSession = (() => {
      try { return sessionStorage.getItem(SESSION_CONNECTED_KEY) === "1"; }
      catch { return false; }
    })();
    if (hasSession) {
      getConnectedPublicKey()
        .then((key) => {
          if (key && !cancelled) setWallet({ publicKey: key, mode: "freighter", displayKey: shortenKey(key) });
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setWalletReady(true); });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWalletReady(true);
    }
    return () => { cancelled = true; };
  }, []);

  // ── Balance auto-refresh ─────────────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    if (!wallet) return;
    setIsRefreshingBalance(true);
    try {
      const b = await fetchXLMBalance(wallet.publicKey);
      setBalance(b);
      setBalanceHistory((hist) => [...hist.slice(-29), Number(b)]);
    } finally {
      setIsRefreshingBalance(false);
    }
  }, [wallet]);

  useEffect(() => {
    if (wallet) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshBalance();
      const id = setInterval(refreshBalance, 15_000);
      return () => clearInterval(id);
    } else {
      setBalance("0.00");
    }
  }, [wallet, refreshBalance]);

  // ── Generic connect helper ────────────────────────────────────────────────
  async function doConnect(
    fn: () => Promise<{ ok: boolean; publicKey?: string; networkPassphrase?: string; error?: string }>,
    mode: WalletProvider
  ) {
    setIsConnecting(true);
    setError(null);
    const result = await fn();
    if (!result.ok) {
      setError(result.error ?? "Connection failed");
      setIsConnecting(false);
      return;
    }
    const pk = result.publicKey!;
    if (result.networkPassphrase) setNetworkPassphrase(result.networkPassphrase);
    await friendbotFund(pk);
    setWallet({ publicKey: pk, mode, displayKey: shortenKey(pk) });
    try { sessionStorage.setItem(SESSION_CONNECTED_KEY, "1"); } catch {}
    setIsConnecting(false);
  }

  // ── Wallet connect actions ────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!freighterInstalled) {
      setError("Freighter wallet is not installed. Please add the browser extension.");
      return;
    }
    await doConnect(connectFreighter, "freighter");
  }, [freighterInstalled]);

  const connectXBullWallet = useCallback(async () => {
    if (!xbullInstalled) {
      setError("xBull Wallet is not installed. Get it at xbull.app");
      return;
    }
    await doConnect(connectXBull, "xbull");
  }, [xbullInstalled]);

  const connectAlbedoWallet = useCallback(async () => {
    await doConnect(connectAlbedo, "albedo");
  }, []);

  const connectRabetWallet = useCallback(async () => {
    if (!rabetInstalled) {
      setError("Rabet Wallet is not installed. Get it at rabet.io");
      return;
    }
    await doConnect(connectRabet, "rabet");
  }, [rabetInstalled]);

  const disconnect = useCallback(() => {
    try { sessionStorage.removeItem(SESSION_CONNECTED_KEY); } catch {}
    setWallet(null);
    setBalance("0.00");
    setBalanceHistory([]);
    setError(null);
  }, []);

  const watchAddress = useCallback((address: string) => {
    setWallet({ publicKey: address, mode: "watch", displayKey: shortenKey(address) });
    try { sessionStorage.setItem(SESSION_CONNECTED_KEY, "1"); } catch {}
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  /** Routes signing to whichever wallet is connected. */
  const signTransaction = useCallback(
    async (xdr: string, netPassphrase: string): Promise<SignResult> => {
      if (!wallet) return { ok: false, error: "WalletNotConnected: No wallet connected." };
      if (wallet.mode === "freighter") return signWithFreighter(xdr, netPassphrase);
      if (wallet.mode === "xbull")    return signWithXBull(xdr, netPassphrase);
      if (wallet.mode === "albedo")   return signWithAlbedo(xdr, netPassphrase);
      if (wallet.mode === "rabet")    return signWithRabet(xdr, netPassphrase);
      return { ok: false, error: "WalletNotConnected: Watch-only wallet cannot sign." };
    },
    [wallet]
  );

  return (
    <WalletContext.Provider value={{
      wallet, walletReady, balance, balanceHistory, networkPassphrase,
      isConnecting, isRefreshingBalance,
      freighterInstalled, xbullInstalled, albedoAvailable, rabetInstalled,
      error,
      connect, connectXBullWallet, connectAlbedoWallet, connectRabetWallet,
      disconnect, watchAddress, refreshBalance, clearError, signTransaction,
    }}>
      {children}
    </WalletContext.Provider>
  );
}
