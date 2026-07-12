import type { PwaUpdateState, UpdateCheckOutcome } from "../hooks/usePwaUpdate";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PwaUpdateCard } from "./PwaUpdateCard";

const checkForUpdate = vi.fn<() => Promise<UpdateCheckOutcome>>(() => Promise.resolve("up-to-date"));
const applyUpdate = vi.fn<() => void>();
let state: PwaUpdateState;

vi.mock("../hooks/usePwaUpdate", () => ({
  usePwaUpdate: (): PwaUpdateState => state,
}));

const notifySuccess = vi.fn<(message: string) => void>();
const notifyError = vi.fn<(message: string) => void>();
vi.mock("../lib/notifications", () => ({
  notifySuccess: (message: string) => notifySuccess(message),
  notifyError: (message: string) => notifyError(message),
}));

describe("PwaUpdateCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state = {
      updateAvailable: false,
      checking: false,
      lastChecked: null,
      lastUpdated: null,
      checkForUpdate,
      applyUpdate,
    };
  });

  it("shows 'Never' for both timestamps when neither has happened on this device", () => {
    render(<PwaUpdateCard />);
    expect(screen.getAllByText("Never")).toHaveLength(2);
  });

  it("renders the last-checked timestamp when present", () => {
    const when = new Date("2026-06-25T10:00:00Z").getTime();
    state = {
      ...state,
      lastChecked: when,
    };
    render(<PwaUpdateCard />);
    expect(screen.getByText(new Date(when).toLocaleString())).toBeInTheDocument();
  });

  it("renders the last-updated timestamp when present", () => {
    const when = new Date("2026-06-20T08:00:00Z").getTime();
    state = {
      ...state,
      lastUpdated: when,
    };
    render(<PwaUpdateCard />);
    expect(screen.getByText(new Date(when).toLocaleString())).toBeInTheDocument();
  });

  it("reports 'already on the latest version' when the check finds nothing new", async () => {
    render(<PwaUpdateCard />);
    fireEvent.click(screen.getByRole("button", {
      name: "Check for updates",
    }));
    await waitFor(() => expect(checkForUpdate).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(notifySuccess).toHaveBeenCalledWith("You're already on the latest version."));
  });

  it("reports 'updating' when the check finds a newer build", async () => {
    checkForUpdate.mockResolvedValueOnce("updating");
    render(<PwaUpdateCard />);
    fireEvent.click(screen.getByRole("button", {
      name: "Check for updates",
    }));
    await waitFor(() => expect(notifySuccess).toHaveBeenCalledWith("Updating to the latest version…"));
  });

  it("reports a failed check via an error toast", async () => {
    checkForUpdate.mockRejectedValueOnce(new Error("offline"));
    render(<PwaUpdateCard />);
    fireEvent.click(screen.getByRole("button", {
      name: "Check for updates",
    }));
    await waitFor(() => expect(notifyError).toHaveBeenCalledWith("offline"));
  });

  it("only offers 'Update now' when an update is waiting, and applies it on click", () => {
    state = {
      ...state,
      updateAvailable: true,
    };
    render(<PwaUpdateCard />);
    fireEvent.click(screen.getByRole("button", {
      name: "Update now",
    }));
    expect(applyUpdate).toHaveBeenCalledTimes(1);
  });

  it("disables the check button while a check is in flight", () => {
    state = {
      ...state,
      checking: true,
    };
    render(<PwaUpdateCard />);
    expect(screen.getByRole("button", {
      name: "Checking…",
    })).toBeDisabled();
  });
});
