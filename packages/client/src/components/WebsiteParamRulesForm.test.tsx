import type { Website } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WebsiteParamRulesForm } from "./WebsiteParamRulesForm";
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
    domain: "youtube.com",
    siteName: "YouTube",
    slug: "youtube",
    builtIn: false,
    shortenedLinks: [],
    paramRules: [],
    createdAt: "2026-06-01T00:00:00.000Z",
    socialLinks: [],
    ...overrides,
  };
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

const notifyFieldSaved = vi.fn<(label: string) => void>();
const notifyFieldSaveError = vi.fn<(label: string, cause?: string) => void>();
vi.mock("../lib/autoSave", () => ({
  notifyFieldSaved: (label: string) => notifyFieldSaved(label),
  notifyFieldSaveError: (label: string, cause?: string) => notifyFieldSaveError(label, cause),
}));

describe("WebsiteParamRulesForm (auto-save)", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    notifyFieldSaved.mockReset();
    notifyFieldSaveError.mockReset();
    mutationBehavior = "success";
  });

  it("has no Save button (auto-save)", async () => {
    await renderWithRouter(<WebsiteParamRulesForm website={makeWebsite()} />);
    expect(screen.queryByRole("button", {
      name: /save/i,
    })).toBeNull();
  });

  it("saves the param rules array on change when a rule is added and filled", async () => {
    await renderWithRouter(<WebsiteParamRulesForm website={makeWebsite()} />);

    fireEvent.click(screen.getByRole("button", {
      name: /add rule/i,
    }));
    fireEvent.change(screen.getByLabelText("Path suffix"), {
      target: {
        value: "/watch",
      },
    });

    await waitFor(() => expect(updateMutate).toHaveBeenCalled());
    const calls = updateMutate.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall).toEqual({
      id: "site-1",
      input: {
        paramRules: [{
          pathSuffix: "/watch",
          params: [],
        }],
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Param Rules");
  });

  it("saves the param rules array on change when a rule is removed", async () => {
    const website = makeWebsite({
      paramRules: [{
        pathSuffix: "/watch",
        params: ["v"],
      }],
    });
    await renderWithRouter(<WebsiteParamRulesForm website={website} />);

    fireEvent.click(screen.getByRole("button", {
      name: /remove rule/i,
    }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "site-1",
      input: {
        paramRules: [],
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Param Rules");
  });

  it("does not save when the normalized rules are unchanged", async () => {
    const website = makeWebsite({
      paramRules: [{
        pathSuffix: "/watch",
        params: ["v"],
      }],
    });
    await renderWithRouter(<WebsiteParamRulesForm website={website} />);

    fireEvent.blur(screen.getByLabelText("Path suffix"));
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("keeps the value and toasts an error when the save fails", async () => {
    mutationBehavior = "error";
    const website = makeWebsite({
      paramRules: [{
        pathSuffix: "/watch",
        params: ["v"],
      }],
    });
    await renderWithRouter(<WebsiteParamRulesForm website={website} />);

    fireEvent.click(screen.getByRole("button", {
      name: /remove rule/i,
    }));

    await waitFor(() =>
      expect(notifyFieldSaveError).toHaveBeenCalledWith("Param Rules", "offline"));
    expect(screen.queryByLabelText("Path suffix")).toBeNull();
  });
});
