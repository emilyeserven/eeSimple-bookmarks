import type { Website } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WebsiteShortenedLinksForm } from "./WebsiteShortenedLinksForm";
import { makeWebsite as makeWebsiteEntity } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

const updateMutate
  = vi.fn<(vars: { id: string;
    input: Record<string, unknown>; }, opts?: {
      onSuccess?: (data: Website) => void;
      onError?: (error: Error) => void;
    }) => void>();
let mutationBehavior: "success" | "error" = "success";

function makeWebsite(overrides: Partial<Website> = {}): Website {
  return makeWebsiteEntity({
    id: "site-1",
    domain: "youtube.com",
    siteName: "YouTube",
    slug: "youtube",
    ...overrides,
  });
}

vi.mock("../hooks/useWebsites", () => ({
  useUpdateWebsite: () => ({
    mutate: (
      vars: { id: string;
        input: Record<string, unknown>; },
      opts?: { onSuccess?: (data: Website) => void;
        onError?: (error: Error) => void; },
    ) => {
      updateMutate(vars, opts);
      if (mutationBehavior === "success") {
        opts?.onSuccess?.(makeWebsite({
          id: vars.id,
          ...vars.input,
        }));
      }
      else opts?.onError?.(new Error("offline"));
    },
  }),
}));

vi.mock("./LinkPreview", () => ({
  LinkPreview: () => null,
}));
vi.mock("./BulkExpandSection", () => ({
  BulkExpandSection: () => null,
}));

const notifyFieldSaved = vi.fn<(label: string) => void>();
const notifyFieldSaveError = vi.fn<(label: string, cause?: string) => void>();
vi.mock("../lib/autoSave", () => ({
  notifyFieldSaved: (label: string) => notifyFieldSaved(label),
  notifyFieldSaveError: (label: string, cause?: string) => notifyFieldSaveError(label, cause),
}));

describe("WebsiteShortenedLinksForm (auto-save)", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    notifyFieldSaved.mockReset();
    notifyFieldSaveError.mockReset();
    mutationBehavior = "success";
  });

  it("has no Save button (auto-save)", async () => {
    await renderWithRouter(<WebsiteShortenedLinksForm website={makeWebsite()} />);
    expect(screen.queryByRole("button", {
      name: /save/i,
    })).toBeNull();
  });

  it("saves the shortened links array on change when an item is added", async () => {
    await renderWithRouter(<WebsiteShortenedLinksForm website={makeWebsite()} />);

    // Add a row, then type a domain (normalized save fires on each change).
    fireEvent.click(screen.getByRole("button", {
      name: /add shortened link/i,
    }));
    fireEvent.change(screen.getByLabelText("Short domain"), {
      target: {
        value: "youtu.be",
      },
    });

    await waitFor(() => expect(updateMutate).toHaveBeenCalled());
    const calls = updateMutate.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall).toEqual({
      id: "site-1",
      input: {
        shortenedLinks: [{
          domain: "youtu.be",
          expandTo: null,
          keepShortened: false,
        }],
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Shortened Links");
  });

  it("saves the shortened links array on change when an item is removed", async () => {
    const website = makeWebsite({
      shortenedLinks: [{
        domain: "youtu.be",
        expandTo: null,
        keepShortened: false,
      }],
    });
    await renderWithRouter(<WebsiteShortenedLinksForm website={website} />);

    fireEvent.click(screen.getByRole("button", {
      name: /remove shortened link/i,
    }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "site-1",
      input: {
        shortenedLinks: [],
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Shortened Links");
  });

  it("does not save when the normalized array is unchanged", async () => {
    const website = makeWebsite({
      shortenedLinks: [{
        domain: "youtu.be",
        expandTo: null,
        keepShortened: false,
      }],
    });
    await renderWithRouter(<WebsiteShortenedLinksForm website={website} />);

    // Toggling keep-shortened twice would change then revert; here we only blur with no edit.
    fireEvent.blur(screen.getByLabelText("Short domain"));
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("keeps the value and toasts an error when the save fails", async () => {
    mutationBehavior = "error";
    const website = makeWebsite({
      shortenedLinks: [{
        domain: "youtu.be",
        expandTo: null,
        keepShortened: false,
      }],
    });
    await renderWithRouter(<WebsiteShortenedLinksForm website={website} />);

    fireEvent.click(screen.getByRole("button", {
      name: /remove shortened link/i,
    }));

    await waitFor(() =>
      expect(notifyFieldSaveError).toHaveBeenCalledWith("Shortened Links", "offline"));
    // The removed row stays removed locally (optimistic local state).
    expect(screen.queryByLabelText("Short domain")).toBeNull();
  });
});
