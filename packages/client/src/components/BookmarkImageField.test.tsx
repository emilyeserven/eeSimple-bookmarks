import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BookmarkImageField } from "./BookmarkImageField";

// Choosing a file builds an object-URL preview in an effect; jsdom doesn't implement these, so
// stub them per-test rather than touching the shared test setup.
beforeEach(() => {
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:preview"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderField(onChange = vi.fn()) {
  render(
    <BookmarkImageField
      existingImageUrl={null}
      pageUrl=""
      onChange={onChange}
    />,
  );
  return onChange;
}

describe("BookmarkImageField", () => {
  it("reports a dropped image file as an upload intent", () => {
    const onChange = renderField();
    const file = new File(["x"], "photo.png", {
      type: "image/png",
    });

    fireEvent.drop(screen.getByTestId("image-dropzone"), {
      dataTransfer: {
        files: [file],
      },
    });

    expect(onChange).toHaveBeenCalledWith({
      file,
      auto: false,
      remove: false,
    });
  });

  it("ignores a dropped non-image file", () => {
    const onChange = renderField();
    const file = new File(["x"], "notes.txt", {
      type: "text/plain",
    });

    fireEvent.drop(screen.getByTestId("image-dropzone"), {
      dataTransfer: {
        files: [file],
      },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("lists the accepted image formats", () => {
    renderField();

    expect(
      screen.getByText(/JPEG, PNG, WebP, GIF, SVG, AVIF, TIFF/),
    ).toBeInTheDocument();
  });
});
