import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RichTextEditor } from "./RichTextEditor";

describe("RichTextEditor", () => {
  it("renders stored Markdown read-only as formatted HTML", () => {
    const {
      container,
    } = render(
      <RichTextEditor
        editable={false}
        value="Hello **bold** world"
      />,
    );

    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe("bold");
    // No editing toolbar in read-only mode.
    expect(screen.queryByRole("button", {
      name: "Bold",
    })).toBeNull();
  });

  it("shows the formatting toolbar in editable mode", () => {
    render(
      <RichTextEditor
        value=""
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", {
      name: "Bold",
    })).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Bullet list",
    })).toBeInTheDocument();
  });
});
