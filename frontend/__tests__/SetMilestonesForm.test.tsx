import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SetMilestonesForm } from "@/components/SetMilestonesForm";

vi.mock("@/context/WalletContext", () => ({
  useWallet: vi.fn(),
}));

vi.mock("@/lib/contracts", () => ({
  setMilestones: vi.fn(),
}));

import { useWallet } from "@/context/WalletContext";
import { setMilestones } from "@/lib/contracts";

const mockUseWallet = vi.mocked(useWallet);
const mockSetMilestones = vi.mocked(setMilestones);

function renderForm(props: Partial<React.ComponentProps<typeof SetMilestonesForm>> = {}) {
  return render(
    <SetMilestonesForm
      vaultId={BigInt(42)}
      vaultAmountXLM={500}
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

describe("SetMilestonesForm", () => {
  it("renders the form card with title", () => {
    renderForm();
    expect(screen.getByRole("heading", { name: "Set Milestones" })).toBeInTheDocument();
  });

  it("shows one milestone row by default", () => {
    renderForm();
    expect(screen.getByPlaceholderText("Design mockups")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("100")).toBeInTheDocument();
  });

  it("adds a second milestone row when + Add milestone is clicked", () => {
    renderForm();
    fireEvent.click(screen.getByText("+ Add milestone"));
    const descInputs = screen.getAllByPlaceholderText("Design mockups");
    const amtInputs = screen.getAllByPlaceholderText("100");
    expect(descInputs.length).toBe(2);
    expect(amtInputs.length).toBe(2);
  });

  it("removes a milestone row when ✕ is clicked", () => {
    renderForm();
    fireEvent.click(screen.getByText("+ Add milestone"));
    expect(screen.getAllByPlaceholderText("Design mockups").length).toBe(2);
    fireEvent.click(screen.getAllByText("✕")[0]);
    expect(screen.getAllByPlaceholderText("Design mockups").length).toBe(1);
  });

  it("does not show ✕ button with only one row", () => {
    renderForm();
    expect(screen.queryByText("✕")).not.toBeInTheDocument();
  });

  it("disables submit when amounts don't match", () => {
    renderForm({ vaultAmountXLM: 100 });
    fireEvent.change(screen.getByPlaceholderText("Design mockups"), { target: { value: "Feature A" } });
    fireEvent.change(screen.getByPlaceholderText("100"), { target: { value: "50" } });
    const btn = screen.getByRole("button", { name: /Set Milestones on Testnet/ });
    expect(btn).toBeDisabled();
  });

  it("enables submit when wallet connected and amounts match", () => {
    renderForm({ vaultAmountXLM: 100 });
    fireEvent.change(screen.getByPlaceholderText("Design mockups"), { target: { value: "Feature A" } });
    fireEvent.change(screen.getByPlaceholderText("100"), { target: { value: "100" } });
    const btn = screen.getByRole("button", { name: /Set Milestones on Testnet/ });
    expect(btn).not.toBeDisabled();
  });

  it("shows watch-only warning when wallet mode is watch", () => {
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

  it("disables submit when no wallet", () => {
    mockUseWallet.mockReturnValue({ wallet: null } as any);
    renderForm();
    const btn = screen.getByRole("button", { name: /Set Milestones on Testnet/ });
    expect(btn).toBeDisabled();
  });
});
