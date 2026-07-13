import type { EntityLayoutRecord } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LayoutIssuesSettings } from "./LayoutIssuesSettings";
import { renderWithRouter } from "../test-utils/router";

let invalidLayouts: EntityLayoutRecord[] = [];
const clearMutate
  = vi.fn<(kind: string, opts?: { onSuccess?: () => void;
    onError?: (e: Error) => void; }) => void>();

vi.mock("../hooks/useEntityLayouts", () => ({
  useInvalidEntityLayouts: () => invalidLayouts,
  useClearInvalidLayout: () => ({
    mutate: (kind: string, opts?: { onSuccess?: () => void;
      onError?: (e: Error) => void; }) => {
      clearMutate(kind, opts);
      opts?.onSuccess?.();
    },
    isPending: false,
  }),
}));

const copyText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
vi.mock("../lib/clipboard", () => ({
  copyText: (text: string) => copyText(text),
}));

const notifySuccess = vi.fn<(m: string) => void>();
vi.mock("../lib/notifications", () => ({
  notifySuccess: (m: string) => notifySuccess(m),
  notifyError: (m: string) => m,
}));

const invalidRecord: EntityLayoutRecord = {
  entityKind: "custom-property",
  layout: null,
  updatedAt: "2026-07-13T12:00:00.000Z",
  invalid: true,
  rawLayout: {
    foo: "bar",
  },
  issues: ["tabs is missing or not an array"],
};

describe("LayoutIssuesSettings", () => {
  beforeEach(() => {
    invalidLayouts = [];
    clearMutate.mockClear();
    copyText.mockClear();
    notifySuccess.mockClear();
  });

  it("shows an empty state when there are no invalid layouts", async () => {
    await renderWithRouter(<LayoutIssuesSettings />);
    expect(screen.getByText(/every saved page layout is valid/i)).toBeInTheDocument();
  });

  it("lists an invalid row with its kind and specific reasons", async () => {
    invalidLayouts = [invalidRecord];
    await renderWithRouter(<LayoutIssuesSettings />);
    expect(screen.getByText("custom-property")).toBeInTheDocument();
    expect(screen.getByText("tabs is missing or not an array")).toBeInTheDocument();
  });

  it("copies the debug blob when Copy debug info is clicked", async () => {
    invalidLayouts = [invalidRecord];
    await renderWithRouter(<LayoutIssuesSettings />);
    fireEvent.click(screen.getByRole("button", {
      name: /copy debug info/i,
    }));
    await waitFor(() => expect(copyText).toHaveBeenCalledTimes(1));
    expect(copyText.mock.calls[0][0]).toContain("Kind: custom-property");
    expect(copyText.mock.calls[0][0]).toContain("tabs is missing or not an array");
  });

  it("clears the row after confirming Reset", async () => {
    invalidLayouts = [invalidRecord];
    await renderWithRouter(<LayoutIssuesSettings />);
    fireEvent.click(screen.getByRole("button", {
      name: /reset to default/i,
    }));
    // Confirm in the dialog (the dialog's destructive button is labelled "Reset").
    fireEvent.click(await screen.findByRole("button", {
      name: /^reset$/i,
    }));
    await waitFor(() => expect(clearMutate).toHaveBeenCalledWith("custom-property", expect.anything()));
    expect(notifySuccess).toHaveBeenCalled();
  });
});
