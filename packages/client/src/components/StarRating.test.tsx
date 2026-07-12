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

describe("StarRating range band", () => {
  /** Count the filled (amber) star overlays in a read-only render. */
  function filledStars(node: HTMLElement): number {
    return node.querySelectorAll(".text-amber-400").length;
  }

  it("draws a start-exclusive band by default (3→5 fills stars 4,5)", () => {
    const {
      container,
    } = render(
      <StarRating
        value={3}
        rangeEnd={5}
        max={5}
        readOnly
      />,
    );
    expect(filledStars(container)).toBe(2);
  });

  it("includes the start level when rangeIncludeStart is set (3→5 fills 3,4,5)", () => {
    const {
      container,
    } = render(
      <StarRating
        value={3}
        rangeEnd={5}
        max={5}
        readOnly
        rangeIncludeStart
      />,
    );
    expect(filledStars(container)).toBe(3);
  });
});
