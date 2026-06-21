import type { AutofillRule, Category, CustomProperty, MediaType } from "@eesimple/types";

import { emptyConditionTree } from "@eesimple/types";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AutofillRulePrefillForm } from "./AutofillRulePrefillForm";
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
  {
    id: "cat-1",
    name: "Recipes",
    slug: "recipes",
    description: null,
    icon: null,
  } as Category,
];
const mediaTypes: MediaType[] = [
  {
    id: "mt-1",
    name: "Article",
    slug: "article",
  } as MediaType,
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
  useMediaTypes: () => ({
    data: mediaTypes,
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

// Stub the pickers so the test can drive each onChange directly without a real Select/TagPicker.
vi.mock("./AutofillRulePrefillPickers", () => ({
  AutofillRulePrefillPickers: ({
    onCategoryChange, onMediaTypeChange, onToggleTag,
  }: {
    onCategoryChange: (value: string) => void;
    onMediaTypeChange: (value: string) => void;
    onToggleTag: (id: string) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => onCategoryChange("cat-1")}
      >pick-category
      </button>
      <button
        type="button"
        onClick={() => onMediaTypeChange("mt-1")}
      >pick-media-type
      </button>
      <button
        type="button"
        onClick={() => onToggleTag("tag-1")}
      >toggle-tag
      </button>
    </div>
  ),
}));

const rule: AutofillRule = {
  id: "rule-1",
  name: "Recipes",
  slug: "recipes",
  description: null,
  conditions: emptyConditionTree(),
  setCategoryId: null,
  setMediaTypeId: null,
  tagIds: [],
  numberValues: [],
  booleanValues: [],
  dateTimeValues: [],
  sortOrder: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
};

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
