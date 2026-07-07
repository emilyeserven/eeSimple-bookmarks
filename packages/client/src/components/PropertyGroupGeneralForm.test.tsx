import type { PropertyGroup } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PropertyGroupGeneralForm } from "./PropertyGroupGeneralForm";
import { renderWithRouter } from "../test-utils/router";

const updateMutate
  = vi.fn<(vars: { id: string;
    input: Record<string, unknown>; }, opts?: {
      onSuccess?: (data: PropertyGroup) => void;
      onError?: (error: Error) => void;
    }) => void>();
let mutationBehavior: "success" | "error" = "success";

function makePropertyGroup(overrides: Partial<PropertyGroup> = {}): PropertyGroup {
  return {
    id: "pg-1",
    name: "Reading",
    slug: "reading",
    description: "Books",
    priority: 0,
    categoryIds: [],
    allCategories: false,
    mediaTypeIds: [],
    allMediaTypes: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

vi.mock("@/hooks/usePropertyGroups", () => ({
  useUpdatePropertyGroup: () => ({
    mutate: (
      vars: { id: string;
        input: Record<string, unknown>; },
      opts?: { onSuccess?: (data: PropertyGroup) => void;
        onError?: (error: Error) => void; },
    ) => {
      updateMutate(vars, opts);
      if (mutationBehavior === "success") {
        opts?.onSuccess?.(makePropertyGroup({
          id: vars.id,
          ...vars.input,
        }) as PropertyGroup);
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

const group = makePropertyGroup({
  id: "pg-1",
  name: "Reading",
  slug: "reading",
  description: "Books",
  priority: 2,
});

describe("PropertyGroupGeneralForm (auto-save)", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    notifyFieldSaved.mockReset();
    notifyFieldSaveError.mockReset();
    mutationBehavior = "success";
  });

  it("has no Save button (auto-save)", async () => {
    await renderWithRouter(<PropertyGroupGeneralForm group={group} />);
    expect(screen.queryByRole("button", {
      name: /save/i,
    })).toBeNull();
  });

  it("saves only the name field on blur and toasts the field", async () => {
    await renderWithRouter(<PropertyGroupGeneralForm group={group} />);

    const name = screen.getByLabelText("Name");
    fireEvent.change(name, {
      target: {
        value: "Reading List",
      },
    });
    fireEvent.blur(name);

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "pg-1",
      input: {
        name: "Reading List",
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Name");
  });

  it("does not save an unchanged field on blur", async () => {
    await renderWithRouter(<PropertyGroupGeneralForm group={group} />);
    fireEvent.blur(screen.getByLabelText("Name"));
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("does not save when a required field is cleared and shows the inline error", async () => {
    await renderWithRouter(<PropertyGroupGeneralForm group={group} />);
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
    await renderWithRouter(<PropertyGroupGeneralForm group={group} />);

    const name = screen.getByLabelText<HTMLInputElement>("Name");
    fireEvent.change(name, {
      target: {
        value: "Reading List",
      },
    });
    fireEvent.blur(name);

    await waitFor(() => expect(notifyFieldSaveError).toHaveBeenCalledWith("Name", "offline"));
    expect(name.value).toBe("Reading List");
  });
});
