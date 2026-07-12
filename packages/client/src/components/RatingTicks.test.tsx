import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RatingTicks } from "./RatingTicks";

describe("RatingTicks", () => {
  it("renders one interactive tick per level and sets the value on click", () => {
    const onChange = vi.fn();
    render(
      <RatingTicks
        value={0}
        max={5}
        onChange={onChange}
      />,
    );
    const ticks = screen.getAllByRole("button", {
      name: /Rate \d+ of 5/,
    });
    expect(ticks).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", {
      name: "Rate 3 of 5",
    }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("renders no interactive buttons when read-only", () => {
    render(
      <RatingTicks
        value={2}
        rangeEnd={4}
        max={5}
        readOnly
      />,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("clears to zero when re-clicking the current value with allowZero", () => {
    const onChange = vi.fn();
    render(
      <RatingTicks
        value={3}
        max={5}
        allowZero
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", {
      name: "Rate 3 of 5",
    }));
    expect(onChange).toHaveBeenCalledWith(0);
  });
});
