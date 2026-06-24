import type { Website } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WebsiteGeneralForm } from "./WebsiteGeneralForm";
import { renderWithRouter } from "../test-utils/router";

const updateMutate
  = vi.fn<(vars: { id: string;
    input: Record<string, unknown>; }, opts?: {
      onSuccess?: (data: Website) => void;
      onError?: (error: Error) => void;
    }) => void>();
let mutationBehavior: "success" | "error" = "success";

function makeWebsite(overrides: Partial<Website> = {}): Website {
  return {
    id: "site-1",
    domain: "github.com",
    siteName: "GitHub",
    slug: "github",
    builtIn: false,
    shortenedLinks: [],
    paramRules: [],
    createdAt: "2026-06-01T00:00:00.000Z",
    category: null,
    tagIds: [],
    mediaTypeId: null,
    socialLinks: [],
    ...overrides,
  };
}

vi.mock("@/hooks/useWebsites", () => ({
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
  useUploadWebsiteFavicon: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useAutoWebsiteFavicon: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteWebsiteFavicon: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({
    data: [],
  }),
  useCreateCategory: () => ({
    mutate: vi.fn(),
    isError: false,
    error: null,
  }),
}));
vi.mock("@/hooks/useMediaTypes", () => ({
  useMediaTypes: () => ({
    data: [],
  }),
  useMediaTypeTree: () => ({
    data: [],
  }),
  useCreateMediaType: () => ({
    mutate: vi.fn(),
    isError: false,
    error: null,
  }),
}));
vi.mock("@/hooks/useTags", () => ({
  useTagTree: () => ({
    data: [],
  }),
  useCreateTag: () => ({
    mutate: vi.fn(),
    isError: false,
    error: null,
  }),
}));

const notifyFieldSaved = vi.fn<(label: string) => void>();
const notifyFieldSaveError = vi.fn<(label: string, cause?: string) => void>();
vi.mock("../lib/autoSave", () => ({
  notifyFieldSaved: (label: string) => notifyFieldSaved(label),
  notifyFieldSaveError: (label: string, cause?: string) => notifyFieldSaveError(label, cause),
}));

const website = makeWebsite();

describe("WebsiteGeneralForm (auto-save)", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    notifyFieldSaved.mockReset();
    notifyFieldSaveError.mockReset();
    mutationBehavior = "success";
  });

  it("has no Save button (auto-save)", async () => {
    await renderWithRouter(<WebsiteGeneralForm website={website} />);
    expect(screen.queryByRole("button", {
      name: /save/i,
    })).toBeNull();
  });

  it("saves only the site name field on blur and toasts the field", async () => {
    await renderWithRouter(<WebsiteGeneralForm website={website} />);

    const siteName = screen.getByLabelText("Site name");
    fireEvent.change(siteName, {
      target: {
        value: "GitHub Inc",
      },
    });
    fireEvent.blur(siteName);

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "site-1",
      input: {
        siteName: "GitHub Inc",
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Site name");
  });

  it("does not save an unchanged field on blur", async () => {
    await renderWithRouter(<WebsiteGeneralForm website={website} />);
    fireEvent.blur(screen.getByLabelText("Site name"));
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("does not save when a required field is cleared and shows the inline error", async () => {
    await renderWithRouter(<WebsiteGeneralForm website={website} />);
    const siteName = screen.getByLabelText("Site name");
    fireEvent.change(siteName, {
      target: {
        value: "",
      },
    });
    fireEvent.blur(siteName);

    expect(updateMutate).not.toHaveBeenCalled();
    expect(notifyFieldSaved).not.toHaveBeenCalled();
    expect(await screen.findByText("Site name is required")).toBeInTheDocument();
  });

  it("keeps the typed value and toasts an error when the save fails", async () => {
    mutationBehavior = "error";
    await renderWithRouter(<WebsiteGeneralForm website={website} />);

    const siteName = screen.getByLabelText<HTMLInputElement>("Site name");
    fireEvent.change(siteName, {
      target: {
        value: "GitHub Inc",
      },
    });
    fireEvent.blur(siteName);

    await waitFor(() => expect(notifyFieldSaveError).toHaveBeenCalledWith("Site name", "offline"));
    expect(siteName.value).toBe("GitHub Inc");
  });
});
