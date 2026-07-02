import type { ImageIntent } from "./bookmarkImageIntent";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BookmarkImagePicker } from "./BookmarkImagePicker";

/** Build a minimal DataTransfer stand-in carrying dropped files (jsdom has no real DataTransfer). */
function fileTransfer(files: File[]) {
  return {
    files,
    items: files.map(f => ({
      kind: "file",
      type: f.type,
    })),
    types: ["Files"],
  };
}

function renderPicker(onChange: (i: ImageIntent) => void) {
  render(
    <BookmarkImagePicker
      existingImages={[]}
      candidates={[]}
      pageUrl=""
      onChange={onChange}
    />,
  );
  return screen.getByTestId("image-dropzone");
}

describe("BookmarkImagePicker file drop", () => {
  it("stages a dropped image file as an upload", () => {
    const onChange = vi.fn<(i: ImageIntent) => void>();
    const zone = renderPicker(onChange);
    const file = new File(["x"], "pic.png", {
      type: "image/png",
    });

    fireEvent.dragEnter(zone, {
      dataTransfer: fileTransfer([file]),
    });
    fireEvent.dragOver(zone, {
      dataTransfer: fileTransfer([file]),
    });
    fireEvent.drop(zone, {
      dataTransfer: fileTransfer([file]),
    });

    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last?.uploads).toEqual([file]);
  });

  it("ignores dropped non-image files", () => {
    const onChange = vi.fn<(i: ImageIntent) => void>();
    const zone = renderPicker(onChange);
    const doc = new File(["x"], "notes.txt", {
      type: "text/plain",
    });

    fireEvent.drop(zone, {
      dataTransfer: fileTransfer([doc]),
    });

    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last?.uploads ?? []).toHaveLength(0);
  });

  it("prevents the browser default on a file drop anywhere on the window (no navigate-away)", () => {
    renderPicker(vi.fn());

    const drop = new Event("drop", {
      cancelable: true,
      bubbles: true,
    });
    Object.defineProperty(drop, "dataTransfer", {
      value: fileTransfer([]),
    });
    window.dispatchEvent(drop);

    expect(drop.defaultPrevented).toBe(true);
  });

  it("leaves non-file window drags alone", () => {
    renderPicker(vi.fn());

    const drop = new Event("drop", {
      cancelable: true,
      bubbles: true,
    });
    Object.defineProperty(drop, "dataTransfer", {
      value: {
        files: [],
        items: [],
        types: ["text/plain"],
      },
    });
    window.dispatchEvent(drop);

    expect(drop.defaultPrevented).toBe(false);
  });
});
