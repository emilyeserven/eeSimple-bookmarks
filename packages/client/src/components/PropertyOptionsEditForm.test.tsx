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

describe("PropertyOptionsEditForm (choices auto-save)", () => {
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

  it("persists choicesItems when a choice is added and toasts the field", async () => {
    await renderWithRouter(
      <PropertyOptionsEditForm
        property={choicesProperty}
        numberProperties={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", {
      name: "Add choice",
    }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const {
      input,
    } = updateMutate.mock.calls[0][0];
    expect(input).toHaveProperty("choicesItems");
    expect((input.choicesItems as unknown[]).length).toBe(2);
    expect(notifyFieldSaved).toHaveBeenCalledWith("Choices");
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
