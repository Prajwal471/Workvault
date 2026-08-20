import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RaiseDisputeForm } from "@/components/RaiseDisputeForm";

vi.mock("@/context/WalletContext", () => ({
  useWallet: vi.fn(),
}));

vi.mock("@/lib/contracts", () => ({
  raiseDispute: vi.fn(),
}));

import { useWallet } from "@/context/WalletContext";
import { raiseDispute } from "@/lib/contracts";

const mockUseWallet = vi.mocked(useWallet);
const mockRaiseDispute = vi.mocked(raiseDispute);

function renderForm(props: Partial<React.ComponentProps<typeof RaiseDisputeForm>> = {}) {
  return render(
    <RaiseDisputeForm
      vaultId={BigInt(42)}
      {...props}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseWallet.mockReturnValue({
    wallet: { publicKey: "GCDEF...1234", mode: "freighter", displayKey: "GCDEF…1234" },
  } as any);
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
    mockUseWallet.mockReturnValue({ wallet: null } as any);
    renderForm();
    const btn = screen.getByRole("button", { name: /Raise Dispute/ });
    expect(btn).toBeDisabled();
  });

  it("shows watch-only warning", () => {
    mockUseWallet.mockReturnValue({
      wallet: { publicKey: "GCDEF...1234", mode: "watch", displayKey: "GCDEF…1234" },
    } as any);
    renderForm();
    expect(screen.getByText(/Watch-only mode/)).toBeInTheDocument();
  });

  it("shows connect warning when no wallet", () => {
    mockUseWallet.mockReturnValue({ wallet: null } as any);
    renderForm();
    expect(screen.getByText(/Connect your wallet first/)).toBeInTheDocument();
  });
});
