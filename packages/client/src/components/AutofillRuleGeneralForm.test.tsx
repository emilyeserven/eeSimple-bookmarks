import type { AutofillRule } from "@eesimple/types";

import { emptyConditionTree } from "@eesimple/types";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AutofillRuleGeneralForm } from "./AutofillRuleGeneralForm";
import { renderWithRouter } from "../test-utils/router";

const updateMutate
  = vi.fn<(vars: { id: string;
    input: Record<string, unknown>; }, opts?: {
      onSuccess?: (data: AutofillRule) => void;
      onError?: (error: Error) => void;
    }) => void>();
let mutationBehavior: "success" | "error" = "success";

vi.mock("../hooks/useAutofill", () => ({
  useUpdateAutofillRule: () => ({
    mutate: (
      vars: { id: string;
        input: Record<string, unknown>; },
      opts?: { onSuccess?: (data: AutofillRule) => void;
        onError?: (error: Error) => void; },
    ) => {
      updateMutate(vars, opts);
      if (mutationBehavior === "success") {
        opts?.onSuccess?.({
          ...rule,
          ...vars.input,
        } as AutofillRule);
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

const rule: AutofillRule = {
  id: "rule-1",
  name: "Recipes",
  slug: "recipes",
  description: "Cooking links",
  conditions: emptyConditionTree(),
  setCategoryId: null,
  setMediaTypeId: null,
  tagIds: [],
  locationIds: [],
  numberValues: [],
  booleanValues: [],
  dateTimeValues: [],
  sortOrder: 3,
  createdAt: "2024-01-01T00:00:00.000Z",
};

describe("AutofillRuleGeneralForm (auto-save)", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    notifyFieldSaved.mockReset();
    notifyFieldSaveError.mockReset();
    mutationBehavior = "success";
  });

  it("has no Save button (auto-save)", async () => {
    await renderWithRouter(<AutofillRuleGeneralForm rule={rule} />);
    expect(screen.queryByRole("button", {
      name: /save/i,
    })).toBeNull();
  });

  it("saves only the name field on blur and toasts the field", async () => {
    await renderWithRouter(<AutofillRuleGeneralForm rule={rule} />);

    const name = screen.getByLabelText("Name");
    fireEvent.change(name, {
      target: {
        value: "Recipes List",
      },
    });
    fireEvent.blur(name);

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "rule-1",
      input: {
        name: "Recipes List",
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Name");
  });

  it("saves the priority (sortOrder) on blur", async () => {
    await renderWithRouter(<AutofillRuleGeneralForm rule={rule} />);

    const priority = screen.getByLabelText("Priority");
    fireEvent.change(priority, {
      target: {
        value: "7",
      },
    });
    fireEvent.blur(priority);

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "rule-1",
      input: {
        sortOrder: 7,
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Priority");
  });

  it("does not save an unchanged field on blur", async () => {
    await renderWithRouter(<AutofillRuleGeneralForm rule={rule} />);
    fireEvent.blur(screen.getByLabelText("Name"));
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("does not save when the required name is cleared and shows the inline error", async () => {
    await renderWithRouter(<AutofillRuleGeneralForm rule={rule} />);
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

  it("toasts an error when the save fails", async () => {
    mutationBehavior = "error";
    await renderWithRouter(<AutofillRuleGeneralForm rule={rule} />);

    const name = screen.getByLabelText<HTMLInputElement>("Name");
    fireEvent.change(name, {
      target: {
        value: "Recipes List",
      },
    });
    fireEvent.blur(name);

    await waitFor(() => expect(notifyFieldSaveError).toHaveBeenCalledWith("Name", "offline"));
    expect(name.value).toBe("Recipes List");
  });
});
