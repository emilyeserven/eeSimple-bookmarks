import type { HomepageContentSettings as HomepageContent } from "@eesimple/types";

import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomepageContentSettings } from "./HomepageContentSettings";

const settings: HomepageContent = {
  homepageText: "Welcome",
  homepageTextWidth: "full",
  bookmarkQuickAddEnabled: false,
  bookmarkQuickAddWidth: "full",
  bookmarkQuickAddDisplay: "collapsible",
  homepageHeaderHidden: false,
  homepageTextEnabled: true,
  searchEnabled: false,
  searchWidth: "full",
  widgetOrder: ["homepageText", "bookmarkQuickAdd", "search"],
};

const updateMutate = vi.fn<(input: HomepageContent, opts?: unknown) => void>();

vi.mock("../hooks/useAppSettings", () => ({
  useHomepageContentSettings: () => ({
    data: settings,
    isLoading: false,
  }),
  useUpdateHomepageContentSettings: () => ({
    mutate: updateMutate,
    isPending: false,
  }),
}));

// Stub the TipTap editor with a plain textarea so the test focuses on the settings form behavior.
vi.mock("@/components/ui/RichTextEditor", () => ({
  RichTextEditor: ({
    value, onChange,
  }: { value: string;
    onChange?: (md: string) => void; }) => (
    <textarea
      aria-label="Homepage text"
      value={value}
      onChange={event => onChange?.(event.target.value)}
    />
  ),
}));

describe("HomepageContentSettings", () => {
  beforeEach(() => {
    updateMutate.mockReset();
  });

  it("hides the Quick Add options until it is enabled", () => {
    render(<HomepageContentSettings />);

    expect(screen.queryByRole("radio", {
      name: "Collapsible",
    })).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", {
      name: /Enable Bookmark Quick Add/,
    }));

    expect(screen.getByRole("radio", {
      name: "Collapsible",
    })).toBeInTheDocument();
    expect(screen.getByRole("radio", {
      name: "Expanded",
    })).toBeInTheDocument();
  });

  it("auto-saves the homepage-text visibility toggle without clearing the text", () => {
    vi.useFakeTimers();
    try {
      render(<HomepageContentSettings />);

      fireEvent.click(screen.getByRole("checkbox", {
        name: "Show homepage text",
      }));

      act(() => {
        vi.runAllTimers();
      });

      expect(updateMutate).toHaveBeenCalledTimes(1);
      const [payload] = updateMutate.mock.calls[0];
      // The toggle goes off but the existing draft text is preserved in the payload.
      expect(payload).toMatchObject({
        homepageTextEnabled: false,
        homepageText: "Welcome",
      });
    }
    finally {
      vi.useRealTimers();
    }
  });

  it("auto-saves the edited homepage content after a debounce", () => {
    vi.useFakeTimers();
    try {
      render(<HomepageContentSettings />);

      fireEvent.change(screen.getByLabelText("Homepage text"), {
        target: {
          value: "Updated copy",
        },
      });
      fireEvent.click(screen.getByRole("checkbox", {
        name: /Enable Bookmark Quick Add/,
      }));
      fireEvent.click(screen.getByRole("radio", {
        name: "Expanded",
      }));

      // No Save button — editing schedules a debounced save instead.
      expect(screen.queryByRole("button", {
        name: "Save",
      })).toBeNull();

      // The rapid edits coalesce into a single save once the debounce window elapses.
      act(() => {
        vi.runAllTimers();
      });

      expect(updateMutate).toHaveBeenCalledTimes(1);
      const [payload] = updateMutate.mock.calls[0];
      expect(payload).toMatchObject({
        homepageText: "Updated copy",
        bookmarkQuickAddEnabled: true,
        bookmarkQuickAddDisplay: "expanded",
      });
    }
    finally {
      vi.useRealTimers();
    }
  });
});
