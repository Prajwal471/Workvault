import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, statusVariant } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies default neutral variant class", () => {
    render(<Badge>Test</Badge>);
    const badge = screen.getByText("Test");
    expect(badge.className).toContain("bg-[var(--cream-soft)]");
  });

  it("applies success variant class", () => {
    render(<Badge variant="success">Done</Badge>);
    const badge = screen.getByText("Done");
    expect(badge.className).toContain("bg-[#e7f2ec]");
  });

  it("renders dot when dot prop is true", () => {
    const { container } = render(<Badge dot>With Dot</Badge>);
    const dot = container.querySelector(".w-1\\.5");
    expect(dot).toBeTruthy();
  });

  it("applies custom className", () => {
    render(<Badge className="extra-class">Custom</Badge>);
    const badge = screen.getByText("Custom");
    expect(badge.className).toContain("extra-class");
  });
});

describe("statusVariant", () => {
  it("maps Created to neutral", () => {
    expect(statusVariant("Created")).toBe("neutral");
  });

  it("maps Funded to info", () => {
    expect(statusVariant("Funded")).toBe("info");
  });

  it("maps InReview to pending", () => {
    expect(statusVariant("InReview")).toBe("pending");
  });

  it("maps Completed to success", () => {
    expect(statusVariant("Completed")).toBe("success");
  });

  it("maps Cancelled to warning", () => {
    expect(statusVariant("Cancelled")).toBe("warning");
  });

  it("maps unknown status to neutral", () => {
    expect(statusVariant("UnknownStatus")).toBe("neutral");
  });
});
