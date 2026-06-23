import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SelfIdsField } from "./SelfIdsField";

const baseProps = {
  selfIds: ["SNL", "Weekend Update"],
  newSelfId: "",
  onNewSelfIdChange: vi.fn(),
  onAdd: vi.fn(),
  onRemove: vi.fn(),
  description: "Short names a channel appends to titles.",
};

describe("SelfIdsField", () => {
  it("renders the default label, description, and a badge per self-id", () => {
    render(<SelfIdsField {...baseProps} />);
    expect(screen.getByText("Self-identifiers")).toBeInTheDocument();
    expect(screen.getByText(baseProps.description)).toBeInTheDocument();
    expect(screen.getByText("SNL")).toBeInTheDocument();
    expect(screen.getByText("Weekend Update")).toBeInTheDocument();
  });

  it("uses a custom label when provided", () => {
    render(
      <SelfIdsField
        {...baseProps}
        label="Channel self-identifiers"
      />,
    );
    expect(screen.getByText("Channel self-identifiers")).toBeInTheDocument();
  });

  it("calls onRemove when a badge is clicked", () => {
    const onRemove = vi.fn();
    render(
      <SelfIdsField
        {...baseProps}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByText("SNL"));
    expect(onRemove).toHaveBeenCalledWith("SNL");
  });

  it("propagates input changes", () => {
    const onNewSelfIdChange = vi.fn();
    render(
      <SelfIdsField
        {...baseProps}
        onNewSelfIdChange={onNewSelfIdChange}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("e.g. SNL"), {
      target: {
        value: "ABC",
      },
    });
    expect(onNewSelfIdChange).toHaveBeenCalledWith("ABC");
  });

  it("disables Add when the draft is blank and enables it otherwise", () => {
    const {
      rerender,
    } = render(
      <SelfIdsField
        {...baseProps}
        newSelfId="  "
      />,
    );
    expect(screen.getByRole("button", {
      name: "Add",
    })).toBeDisabled();
    rerender(
      <SelfIdsField
        {...baseProps}
        newSelfId="ABC"
      />,
    );
    expect(screen.getByRole("button", {
      name: "Add",
    })).toBeEnabled();
  });

  it("fires onAdd on click and on Enter", () => {
    const onAdd = vi.fn();
    render(
      <SelfIdsField
        {...baseProps}
        newSelfId="ABC"
        onAdd={onAdd}
      />,
    );
    fireEvent.click(screen.getByRole("button", {
      name: "Add",
    }));
    fireEvent.keyDown(screen.getByPlaceholderText("e.g. SNL"), {
      key: "Enter",
    });
    expect(onAdd).toHaveBeenCalledTimes(2);
  });
});
