import type { MediaType } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MediaTypeGeneralForm } from "./MediaTypeGeneralForm";
import { makeMediaType as mediaTypeBase } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

const updateMutate
  = vi.fn<(vars: { id: string;
    input: Record<string, unknown>; }, opts?: {
      onSuccess?: (data: MediaType) => void;
      onError?: (error: Error) => void;
    }) => void>();
let mutationBehavior: "success" | "error" = "success";

function makeMediaType(overrides: Partial<MediaType> = {}): MediaType {
  return mediaTypeBase({
    id: "mt-1",
    name: "Video",
    slug: "video",
    icon: "play",
    ...overrides,
  });
}

vi.mock("@/hooks/useMediaTypes", () => ({
  useMediaTypes: () => ({
    data: [makeMediaType({
      id: "mt-1",
      name: "Video",
      slug: "video",
    })],
  }),
  useUpdateMediaType: () => ({
    mutate: (
      vars: { id: string;
        input: Record<string, unknown>; },
      opts?: { onSuccess?: (data: MediaType) => void;
        onError?: (error: Error) => void; },
    ) => {
      updateMutate(vars, opts);
      if (mutationBehavior === "success") {
        opts?.onSuccess?.(makeMediaType({
          id: vars.id,
          ...vars.input,
        }) as MediaType);
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

const mediaType = makeMediaType({
  id: "mt-1",
  name: "Video",
  slug: "video",
  sortOrder: 2,
});

describe("MediaTypeGeneralForm (auto-save)", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    notifyFieldSaved.mockReset();
    notifyFieldSaveError.mockReset();
    mutationBehavior = "success";
  });

  it("has no Save button (auto-save)", async () => {
    await renderWithRouter(<MediaTypeGeneralForm mediaType={mediaType} />);
    expect(screen.queryByRole("button", {
      name: /save/i,
    })).toBeNull();
  });

  it("saves only the name field on blur and toasts the field", async () => {
    await renderWithRouter(<MediaTypeGeneralForm mediaType={mediaType} />);

    const name = screen.getByLabelText("Name");
    fireEvent.change(name, {
      target: {
        value: "Videos",
      },
    });
    fireEvent.blur(name);

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "mt-1",
      input: {
        name: "Videos",
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Name");
  });

  it("does not save an unchanged field on blur", async () => {
    await renderWithRouter(<MediaTypeGeneralForm mediaType={mediaType} />);
    fireEvent.blur(screen.getByLabelText("Name"));
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("does not save when a required field is cleared and shows the inline error", async () => {
    await renderWithRouter(<MediaTypeGeneralForm mediaType={mediaType} />);
    const name = screen.getByLabelText("Name");
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
    await renderWithRouter(<MediaTypeGeneralForm mediaType={mediaType} />);

    const name = screen.getByLabelText<HTMLInputElement>("Name");
    fireEvent.change(name, {
      target: {
        value: "Videos",
      },
    });
    fireEvent.blur(name);

    await waitFor(() => expect(notifyFieldSaveError).toHaveBeenCalledWith("Name", "offline"));
    expect(name.value).toBe("Videos");
  });
});
