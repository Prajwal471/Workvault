import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RaiseDisputeForm } from "@/components/RaiseDisputeForm";

vi.mock("@/context/WalletContext", () => ({
  useWallet: vi.fn(),
}));

vi.mock("@/lib/contracts", () => ({
  raiseDispute: vi.fn(),
}));

import { useWallet, type WalletContextValue } from "@/context/WalletContext";

const mockUseWallet = vi.mocked(useWallet);

function renderForm(props: Partial<React.ComponentProps<typeof RaiseDisputeForm>> = {}) {
  return render(
    <RaiseDisputeForm
      vaultId={BigInt(42)}
      {...props}
    />
  );
}

function walletValue(overrides: Partial<WalletContextValue>): WalletContextValue {
  return {
    wallet: { publicKey: "GCDEF...1234", mode: "freighter", displayKey: "GCDEF…1234" },
    walletReady: true,
    balance: "0",
    balanceHistory: [],
    networkPassphrase: "Test SDF Network ; September 2015",
    isConnecting: false,
    isRefreshingBalance: false,
    freighterInstalled: true,
    xbullInstalled: false,
    albedoAvailable: false,
    rabetInstalled: false,
    error: null,
    connect: vi.fn(),
    connectXBullWallet: vi.fn(),
    connectAlbedoWallet: vi.fn(),
    connectRabetWallet: vi.fn(),
    disconnect: vi.fn(),
    watchAddress: vi.fn(),
    refreshBalance: vi.fn(),
    clearError: vi.fn(),
    signTransaction: vi.fn(),
    ...overrides,
  } as WalletContextValue;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseWallet.mockReturnValue(walletValue({}));
});

afterEach(() => {
  cleanup();
});

describe("RaiseDisputeForm", () => {
  it("renders the form card with title", () => {
    renderForm();
    expect(screen.getByRole("heading", { name: "Raise Dispute" })).toBeInTheDocument();
  });

  it("shows the textarea for dispute reason", () => {
    renderForm();
    expect(screen.getByPlaceholderText(/Describe why/)).toBeInTheDocument();
  });

  it("disables submit when reason is empty", () => {
    renderForm();
    const btn = screen.getByRole("button", { name: /Raise Dispute/ });
    expect(btn).toBeDisabled();
  });

  it("enables submit when reason is provided and wallet connected", () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText(/Describe why/), {
      target: { value: "Deliverable does not match specs" },
    });
    const btn = screen.getByRole("button", { name: /Raise Dispute/ });
    expect(btn).not.toBeDisabled();
  });

  it("disables submit when no wallet", () => {
    mockUseWallet.mockReturnValue(walletValue({ wallet: null }));
    renderForm();
    const btn = screen.getByRole("button", { name: /Raise Dispute/ });
    expect(btn).toBeDisabled();
  });

  it("shows watch-only warning", () => {
    mockUseWallet.mockReturnValue(walletValue({
      wallet: { publicKey: "GCDEF...1234", mode: "watch", displayKey: "GCDEF…1234" },
    }));
    renderForm();
    expect(screen.getByText(/Watch-only mode/)).toBeInTheDocument();
  });

  it("shows connect warning when no wallet", () => {
    mockUseWallet.mockReturnValue(walletValue({ wallet: null }));
    renderForm();
    expect(screen.getByText(/Connect your wallet first/)).toBeInTheDocument();
  });
});
