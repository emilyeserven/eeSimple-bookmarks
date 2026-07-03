import type { YouTubeChannel } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { YouTubeChannelGeneralForm } from "./YouTubeChannelGeneralForm";
import { makeYouTubeChannel } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

const updateMutate
  = vi.fn<(vars: { id: string;
    input: Record<string, unknown>; }, opts?: {
      onSuccess?: (data: YouTubeChannel) => void;
      onError?: (error: Error) => void;
    }) => void>();
let mutationBehavior: "success" | "error" = "success";

function makeChannel(overrides: Partial<YouTubeChannel> = {}): YouTubeChannel {
  return makeYouTubeChannel({
    id: "ch-1",
    channelKey: "@veritasium",
    name: "Veritasium",
    slug: "veritasium",
    ...overrides,
  });
}

vi.mock("@/hooks/useYouTubeChannels", () => ({
  useUpdateYouTubeChannel: () => ({
    mutate: (
      vars: { id: string;
        input: Record<string, unknown>; },
      opts?: { onSuccess?: (data: YouTubeChannel) => void;
        onError?: (error: Error) => void; },
    ) => {
      updateMutate(vars, opts);
      if (mutationBehavior === "success") {
        opts?.onSuccess?.(makeChannel({
          id: vars.id,
          ...vars.input,
        }));
      }
      else opts?.onError?.(new Error("offline"));
    },
  }),
  useUploadYouTubeChannelImage: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useAutoYouTubeChannelImage: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteYouTubeChannelImage: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({
    data: [],
  }),
  useCategoryAvailableTags: () => ({
    data: undefined,
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

describe("YouTubeChannelGeneralForm (auto-save)", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    notifyFieldSaved.mockReset();
    notifyFieldSaveError.mockReset();
    mutationBehavior = "success";
  });

  it("has no Save button (auto-save)", async () => {
    await renderWithRouter(<YouTubeChannelGeneralForm channel={makeChannel()} />);
    expect(screen.queryByRole("button", {
      name: /save/i,
    })).toBeNull();
  });

  it("saves only the name field on blur and toasts the field", async () => {
    await renderWithRouter(<YouTubeChannelGeneralForm channel={makeChannel()} />);

    const name = screen.getByLabelText("Channel name");
    fireEvent.change(name, {
      target: {
        value: "Veritasium HD",
      },
    });
    fireEvent.blur(name);

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "ch-1",
      input: {
        name: "Veritasium HD",
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Name");
  });

  it("does not save an unchanged name on blur", async () => {
    await renderWithRouter(<YouTubeChannelGeneralForm channel={makeChannel()} />);
    fireEvent.blur(screen.getByLabelText("Channel name"));
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("does not save when the name is cleared and shows the inline error", async () => {
    await renderWithRouter(<YouTubeChannelGeneralForm channel={makeChannel()} />);
    const name = screen.getByLabelText("Channel name");
    fireEvent.change(name, {
      target: {
        value: "",
      },
    });
    fireEvent.blur(name);

    expect(updateMutate).not.toHaveBeenCalled();
    expect(notifyFieldSaved).not.toHaveBeenCalled();
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
  });

  it("keeps the typed value and toasts an error when the save fails", async () => {
    mutationBehavior = "error";
    await renderWithRouter(<YouTubeChannelGeneralForm channel={makeChannel()} />);

    const name = screen.getByLabelText<HTMLInputElement>("Channel name");
    fireEvent.change(name, {
      target: {
        value: "Veritasium HD",
      },
    });
    fireEvent.blur(name);

    await waitFor(() => expect(notifyFieldSaveError).toHaveBeenCalledWith("Name", "offline"));
    expect(name.value).toBe("Veritasium HD");
  });

  it("saves the selfIds array on change when a self-identifier is added", async () => {
    await renderWithRouter(<YouTubeChannelGeneralForm channel={makeChannel()} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. SNL"), {
      target: {
        value: "VERITAS",
      },
    });
    fireEvent.click(screen.getByRole("button", {
      name: "Add",
    }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "ch-1",
      input: {
        selfIds: ["VERITAS"],
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Self-identifiers");
  });

  it("saves the selfIds array on change when a self-identifier is removed", async () => {
    await renderWithRouter(
      <YouTubeChannelGeneralForm
        channel={makeChannel({
          selfIds: ["VERITAS"],
        })}
      />,
    );

    fireEvent.click(screen.getByTitle("Remove \"VERITAS\""));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "ch-1",
      input: {
        selfIds: [],
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Self-identifiers");
  });
});
