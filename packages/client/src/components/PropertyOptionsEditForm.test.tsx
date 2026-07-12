import type { CustomProperty } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PropertyOptionsEditForm } from "./PropertyOptionsEditForm";
import { OPTIONS_KEYS } from "./propertyOptionsKeys";
import { makeCustomProperty } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

const updateMutate
  = vi.fn<(vars: { id: string;
    input: Record<string, unknown>; }, opts?: {
      onSuccess?: (data: CustomProperty) => void;
      onError?: (error: Error) => void;
    }) => void>();

vi.mock("../hooks/useCustomProperties", () => ({
  useCustomProperties: () => ({
    data: [],
  }),
  useUpdateCustomProperty: () => ({
    mutate: (
      vars: { id: string;
        input: Record<string, unknown>; },
      opts?: { onSuccess?: (data: CustomProperty) => void;
        onError?: (error: Error) => void; },
    ) => {
      updateMutate(vars, opts);
      opts?.onSuccess?.(makeCustomProperty({
        id: vars.id,
        ...vars.input,
      }));
    },
  }),
}));

const notifyFieldSaved = vi.fn<(label: string) => void>();
const notifyFieldSaveError = vi.fn<(label: string, cause?: string) => void>();
vi.mock("../lib/autoSave", () => ({
  notifyFieldSaved: (label: string) => notifyFieldSaved(label),
  notifyFieldSaveError: (label: string, cause?: string) => notifyFieldSaveError(label, cause),
}));

const choicesProperty = makeCustomProperty({
  id: "prop-choices",
  name: "Complexity",
  slug: "complexity",
  type: "choices",
  choicesDisplay: "radio",
  choicesItems: [{
    label: "Easy",
    value: "easy",
  }],
});

/** The most recent update call whose input carried the given key (blur saves every changed key). */
function callWithKey(key: string) {
  return updateMutate.mock.calls.find(([vars]) => key in vars.input);
}

describe("PropertyOptionsEditForm (options save on blur)", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    notifyFieldSaved.mockReset();
    notifyFieldSaveError.mockReset();
  });

  it("does not fire a save on mount", async () => {
    await renderWithRouter(
      <PropertyOptionsEditForm
        property={choicesProperty}
        numberProperties={[]}
      />,
    );
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("does not save a change until focus leaves the field", async () => {
    await renderWithRouter(
      <PropertyOptionsEditForm
        property={choicesProperty}
        numberProperties={[]}
      />,
    );

    // Adding a choice mutates the form, but nothing has blurred yet — no save fires.
    fireEvent.click(screen.getByRole("button", {
      name: "Add choice",
    }));
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("persists the changed option on blur and toasts the field", async () => {
    await renderWithRouter(
      <PropertyOptionsEditForm
        property={choicesProperty}
        numberProperties={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", {
      name: "Add choice",
    }));
    // Blur bubbles to the section's onBlur, which runs the save pass.
    fireEvent.blur(screen.getByRole("button", {
      name: "Add choice",
    }));

    await waitFor(() => expect(callWithKey("choicesItems")).toBeTruthy());
    const call = callWithKey("choicesItems");
    if (!call) throw new Error("expected a choicesItems save");
    expect((call[0].input.choicesItems as unknown[]).length).toBe(2);
    expect(notifyFieldSaved).toHaveBeenCalledWith("Choices");
  });

  it("flushes a changed option on unmount (leaving the tab before blur)", async () => {
    const {
      unmount,
    } = await renderWithRouter(
      <PropertyOptionsEditForm
        property={choicesProperty}
        numberProperties={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", {
      name: "Add choice",
    }));
    expect(updateMutate).not.toHaveBeenCalled();

    unmount();
    const call = callWithKey("choicesItems");
    if (!call) throw new Error("expected a choicesItems save on unmount");
    expect((call[0].input.choicesItems as unknown[]).length).toBe(2);
  });
});

describe("OPTIONS_KEYS coverage", () => {
  // Guards against the original bug: a type-specific option key emitted by `payloadFromValues` but
  // missing from `OPTIONS_KEYS` is never saved. Every options-owned key must be listed here.
  it.each([
    ["choicesItems"],
    ["choicesDisplay"],
    ["choicesMultiple"],
    ["itemInItemsBeforeText"],
    ["itemInItemsBetweenText"],
    ["itemInItemsAfterText"],
    ["itemInItemsMediaTypeTexts"],
    ["itemInItemsSourcePropertyId"],
    ["sectionsDefaultType"],
    ["sectionsAllowedTypes"],
    ["sectionsTiered"],
  ])("includes %s", (key) => {
    expect(OPTIONS_KEYS).toContain(key);
  });
});
