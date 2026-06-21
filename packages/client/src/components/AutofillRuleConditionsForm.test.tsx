import type { AutofillRule, ConditionTree } from "@eesimple/types";

import { emptyConditionTree } from "@eesimple/types";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AutofillRuleConditionsForm } from "./AutofillRuleConditionsForm";
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

vi.mock("../hooks/useCategories", () => ({
  useCategories: () => ({
    data: [],
  }),
}));
vi.mock("../hooks/useCustomProperties", () => ({
  useCustomProperties: () => ({
    data: [],
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

// Stub ConditionsField so the test can drive onChange with valid/invalid trees directly.
const VALID_TREE: ConditionTree = {
  type: "group",
  combinator: "and",
  children: [{
    type: "match",
    field: "title",
    operator: "contains",
    pattern: "recipe",
  }],
};
const INVALID_TREE: ConditionTree = {
  type: "group",
  combinator: "and",
  children: [{
    type: "match",
    field: "title",
    operator: "contains",
    pattern: "",
  }],
};

vi.mock("./conditions/ConditionsField", () => ({
  ConditionsField: ({
    onChange,
  }: { onChange: (next: ConditionTree) => void }) => (
    <div>
      <button
        type="button"
        onClick={() => onChange(VALID_TREE)}
      >set-valid
      </button>
      <button
        type="button"
        onClick={() => onChange(INVALID_TREE)}
      >set-invalid
      </button>
    </div>
  ),
}));

vi.mock("./PreviewBookmarksSection", () => ({
  PreviewBookmarksSection: () => <div />,
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

describe("AutofillRuleConditionsForm (auto-save)", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    notifyFieldSaved.mockReset();
    notifyFieldSaveError.mockReset();
  });

  it("has no Save button (auto-save)", async () => {
    await renderWithRouter(<AutofillRuleConditionsForm rule={rule} />);
    expect(screen.queryByRole("button", {
      name: /save/i,
    })).toBeNull();
  });

  it("saves only the conditions field when the tree changes to a valid one", async () => {
    await renderWithRouter(<AutofillRuleConditionsForm rule={rule} />);

    fireEvent.click(screen.getByText("set-valid"));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "rule-1",
      input: {
        conditions: VALID_TREE,
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Conditions");
  });

  it("does not save an invalid condition tree", async () => {
    await renderWithRouter(<AutofillRuleConditionsForm rule={rule} />);

    fireEvent.click(screen.getByText("set-invalid"));

    expect(updateMutate).not.toHaveBeenCalled();
    expect(notifyFieldSaved).not.toHaveBeenCalled();
    expect(await screen.findByText(/pattern/i)).toBeInTheDocument();
  });
});
