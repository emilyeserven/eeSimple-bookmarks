import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StarRating } from "./StarRating";

describe("StarRating clear-to-zero button", () => {
  it("renders a clear button that sets the rating to 0 when interactive and allowZero", () => {
    const onChange = vi.fn();
    render(
      <StarRating
        value={3}
        max={5}
        allowZero
        onChange={onChange}
      />,
    );

    const clear = screen.getByRole("button", {
      name: "Clear rating",
    });
    fireEvent.click(clear);

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("hides the clear button when zero is not allowed", () => {
    render(
      <StarRating
        value={3}
        max={5}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", {
      name: "Clear rating",
    })).toBeNull();
  });

  it("hides the clear button in read-only mode", () => {
    render(
      <StarRating
        value={3}
        max={5}
        allowZero
        readOnly
      />,
    );

    expect(screen.queryByRole("button", {
      name: "Clear rating",
    })).toBeNull();
  });
});
