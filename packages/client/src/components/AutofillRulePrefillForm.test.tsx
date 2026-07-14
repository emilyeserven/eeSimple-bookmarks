import type { AutofillRule, Category, CustomProperty, MediaTypeNode } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AutofillRulePrefillForm } from "./AutofillRulePrefillForm";
import { makeAutofillRule, makeCategory, makeMediaType } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

const updateMutate
  = vi.fn<(vars: { id: string;
    input: Record<string, unknown>; }, opts?: {
      onSuccess?: (data: AutofillRule) => void;
      onError?: (error: Error) => void;
    }) => void>();

vi.mock("../hooks/useAutofill", () => ({
  useUpdateAutofillRule: () => ({
    mutate: (
      vars: { id: string;
        input: Record<string, unknown>; },
      opts?: { onSuccess?: (data: AutofillRule) => void;
        onError?: (error: Error) => void; },
    ) => {
      updateMutate(vars, opts);
      opts?.onSuccess?.({
        ...rule,
        ...vars.input,
      } as AutofillRule);
    },
  }),
}));

const categories: Category[] = [
  makeCategory({
    id: "cat-1",
    name: "Recipes",
    slug: "recipes",
  }),
];
const mediaTypeTree: MediaTypeNode[] = [
  {
    ...makeMediaType({
      id: "mt-1",
      name: "Article",
      slug: "article",
    }),
    children: [] as MediaTypeNode[],
  },
];

vi.mock("../hooks/useCategories", () => ({
  useCategories: () => ({
    data: categories,
  }),
}));
vi.mock("../hooks/useCustomProperties", () => ({
  useCustomProperties: () => ({
    data: [] as CustomProperty[],
  }),
}));
vi.mock("../hooks/useMediaTypes", () => ({
  useMediaTypeTree: () => ({
    data: mediaTypeTree,
  }),
}));
vi.mock("../hooks/useTags", () => ({
  useTagTree: () => ({
    data: [],
  }),
}));

const notifyFieldSaved = vi.fn<(label: string) => void>();
const notifyFieldSaveError = vi.fn<(label: string, cause?: string) => void>();
vi.mock("../lib/autoSave", () => ({
  notifyFieldSaved: (label: string) => notifyFieldSaved(label),
  notifyFieldSaveError: (label: string, cause?: string) => notifyFieldSaveError(label, cause),
}));

// Stub the per-field picker halves so the test can drive each onChange directly without a real
// Select/TagPicker. The prefill form is recomposed (#1197) from the five granular edit fields, each
// of which renders one of these halves.
vi.mock("./AutofillRulePrefillPickers", () => ({
  AutofillCategoryPicker: ({
    onChange,
  }: { onChange: (value: string) => void }) => (
    <button
      type="button"
      onClick={() => onChange("cat-1")}
    >pick-category
    </button>
  ),
  AutofillMediaTypePicker: ({
    onChange,
  }: { onChange: (value: string) => void }) => (
    <button
      type="button"
      onClick={() => onChange("mt-1")}
    >pick-media-type
    </button>
  ),
  AutofillTagsPicker: ({
    onToggle,
  }: { onToggle: (id: string) => void }) => (
    <button
      type="button"
      onClick={() => onToggle("tag-1")}
    >toggle-tag
    </button>
  ),
  AutofillLocationsPicker: ({
    onToggle,
  }: { onToggle: (id: string) => void }) => (
    <button
      type="button"
      onClick={() => onToggle("loc-1")}
    >toggle-location
    </button>
  ),
}));

const rule = makeAutofillRule({
  id: "rule-1",
  name: "Recipes",
  slug: "recipes",
  createdAt: "2024-01-01T00:00:00.000Z",
});

describe("AutofillRulePrefillForm (auto-save)", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    notifyFieldSaved.mockReset();
    notifyFieldSaveError.mockReset();
  });

  it("has no Save button (auto-save)", async () => {
    await renderWithRouter(<AutofillRulePrefillForm rule={rule} />);
    expect(screen.queryByRole("button", {
      name: /save/i,
    })).toBeNull();
  });

  it("saves only setCategoryId when the category changes and toasts Category", async () => {
    await renderWithRouter(<AutofillRulePrefillForm rule={rule} />);

    fireEvent.click(screen.getByText("pick-category"));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "rule-1",
      input: {
        setCategoryId: "cat-1",
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Category");
  });

  it("saves only setMediaTypeId when the media type changes and toasts Media Type", async () => {
    await renderWithRouter(<AutofillRulePrefillForm rule={rule} />);

    fireEvent.click(screen.getByText("pick-media-type"));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "rule-1",
      input: {
        setMediaTypeId: "mt-1",
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Media Type");
  });

  it("saves only tagIds when a tag is toggled and toasts Tags", async () => {
    await renderWithRouter(<AutofillRulePrefillForm rule={rule} />);

    fireEvent.click(screen.getByText("toggle-tag"));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "rule-1",
      input: {
        tagIds: ["tag-1"],
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Tags");
  });
});
