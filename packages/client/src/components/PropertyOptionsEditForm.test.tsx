import type { CustomProperty } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  booleanPayloadFields,
  choicesPayloadFields,
  CREATE_DEFAULTS,
  dateTimePayloadFields,
  itemInItemsPayloadFields,
  numberPayloadFields,
  ratingPayloadFields,
  sectionsPayloadFields,
} from "./propertyFormSchema";
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

describe("dateTime options auto-save", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    notifyFieldSaved.mockReset();
  });

  it("persists dateTimeAllowYearMonth when the month-only checkbox is toggled", async () => {
    const dateTimeProperty = makeCustomProperty({
      id: "prop-date",
      name: "Published",
      slug: "published",
      type: "datetime",
      dateTimeFormat: "date",
      dateTimeAllowYearMonth: false,
    });
    await renderWithRouter(
      <PropertyOptionsEditForm
        property={dateTimeProperty}
        numberProperties={[]}
      />,
    );

    fireEvent.click(screen.getByLabelText("Allow month-only (YYYY-MM) dates"));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0].input).toEqual({
      dateTimeAllowYearMonth: true,
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Month-only dates");
  });
});

describe("OPTIONS_KEYS coverage", () => {
  // Derives the source of truth from `payloadFromValues`' type-specific helpers: every key they emit
  // is an options-owned payload field that MUST be in `OPTIONS_KEYS`, or the Options auto-saver never
  // persists it (the silent-drop bug this list guards against — a hardcoded list missed
  // `dateTimeAllowYearMonth`). Adding a field to any helper now fails this test until it is wired.
  const optionOwnedKeys = [
    ...Object.keys(dateTimePayloadFields(CREATE_DEFAULTS)),
    ...Object.keys(numberPayloadFields(CREATE_DEFAULTS)),
    ...Object.keys(booleanPayloadFields(CREATE_DEFAULTS)),
    ...Object.keys(ratingPayloadFields(CREATE_DEFAULTS)),
    ...Object.keys(choicesPayloadFields(CREATE_DEFAULTS)),
    ...Object.keys(itemInItemsPayloadFields(CREATE_DEFAULTS)),
    ...Object.keys(sectionsPayloadFields(CREATE_DEFAULTS)),
    // Non-helper option-owned keys emitted inline by `payloadFromValues`.
    "quickFilterRange",
    "operandPropertyIds",
    "allowDefault",
    "showInDetails",
    "showInGallery",
  ];

  it.each(optionOwnedKeys.map(key => [key]))("OPTIONS_KEYS includes %s", (key) => {
    expect(OPTIONS_KEYS).toContain(key);
  });
});
