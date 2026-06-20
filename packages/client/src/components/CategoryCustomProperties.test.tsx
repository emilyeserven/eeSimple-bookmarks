import type { Category, CustomProperty } from "@eesimple/types";

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CategoryCustomProperties } from "./CategoryCustomProperties";

// The component reads from query hooks; stub them so the test can focus on the
// assign/unassign behavior without a live API or QueryClient.
const updateMutate = vi.fn<(args: unknown) => void>();

const category: Category = {
  id: "cat-1",
  name: "Workflow",
  slug: "workflow",
  description: null,
  icon: null,
  builtIn: false,
  isHomepage: false,
  createdAt: "2026-06-01T00:00:00.000Z",
};

const properties: CustomProperty[] = [
  {
    id: "prop-assigned",
    name: "Priority",
    slug: "priority",
    type: "number",
    builtIn: false,
    numberFormat: null,
    dateTimeFormat: null,
    description: null,
    numberMin: null,
    numberMax: null,
    unitSingular: null,
    unitPlural: null,
    valuePrefix: null,
    zeroLabel: null,
    maxLabel: null,
    operandPropertyIds: [],
    categoryIds: ["cat-1"],
    showInForm: false,
    hiddenFromForm: false,
    showInListings: true,
    allCategories: false,
    mediaTypeIds: [],
    allMediaTypes: false,
    editableOnCard: false,
    enabled: true,
    allowDefault: true,
    showIfFalse: false,
    booleanLabelPreset: null,
    booleanTrueLabel: null,
    booleanFalseLabel: null,
    showLabelColon: true,
    showValueBeforeLabel: false,
    hideLabel: false,
    clickableInView: false,
    ratingMax: null,
    ratingAllowZero: false,
    ratingAllowHalf: false,
    ratingShowLabel: false,
    ratingLabel: null,
    propertyGroupId: null,
    cardImageCorner: null,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "prop-unassigned",
    name: "Archived",
    slug: "archived",
    type: "boolean",
    builtIn: false,
    numberFormat: null,
    dateTimeFormat: null,
    description: null,
    numberMin: null,
    numberMax: null,
    unitSingular: null,
    unitPlural: null,
    valuePrefix: null,
    zeroLabel: null,
    maxLabel: null,
    operandPropertyIds: [],
    categoryIds: [],
    showInForm: false,
    hiddenFromForm: false,
    showInListings: true,
    allCategories: false,
    mediaTypeIds: [],
    allMediaTypes: false,
    editableOnCard: false,
    enabled: true,
    allowDefault: true,
    showIfFalse: false,
    booleanLabelPreset: null,
    booleanTrueLabel: null,
    booleanFalseLabel: null,
    showLabelColon: true,
    showValueBeforeLabel: false,
    hideLabel: false,
    clickableInView: false,
    ratingMax: null,
    ratingAllowZero: false,
    ratingAllowHalf: false,
    ratingShowLabel: false,
    ratingLabel: null,
    propertyGroupId: null,
    cardImageCorner: null,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "prop-all",
    name: "Everywhere",
    slug: "everywhere",
    type: "boolean",
    builtIn: false,
    numberFormat: null,
    dateTimeFormat: null,
    description: null,
    numberMin: null,
    numberMax: null,
    unitSingular: null,
    unitPlural: null,
    valuePrefix: null,
    zeroLabel: null,
    maxLabel: null,
    operandPropertyIds: [],
    categoryIds: [],
    showInForm: false,
    hiddenFromForm: false,
    showInListings: true,
    allCategories: true,
    mediaTypeIds: [],
    allMediaTypes: false,
    editableOnCard: false,
    enabled: true,
    allowDefault: true,
    showIfFalse: false,
    booleanLabelPreset: null,
    booleanTrueLabel: null,
    booleanFalseLabel: null,
    showLabelColon: true,
    showValueBeforeLabel: false,
    hideLabel: false,
    clickableInView: false,
    ratingMax: null,
    ratingAllowZero: false,
    ratingAllowHalf: false,
    ratingShowLabel: false,
    ratingLabel: null,
    propertyGroupId: null,
    cardImageCorner: null,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];

vi.mock("../hooks/useCustomProperties", () => ({
  useCustomProperties: () => ({
    data: properties,
    isLoading: false,
  }),
  useUpdateCustomProperty: () => ({
    mutate: updateMutate,
  }),
}));
vi.mock("../hooks/useCategories", () => ({
  useCategoryDefaults: () => ({
    data: undefined,
  }),
  useSetCategoryDefaults: () => ({
    mutate: vi.fn(),
  }),
}));

describe("CategoryCustomProperties", () => {
  beforeEach(() => {
    updateMutate.mockReset();
  });

  it("reflects which properties are assigned to the category", () => {
    render(<CategoryCustomProperties category={category} />);

    expect(screen.getByRole("checkbox", {
      name: /Priority/,
    })).toBeChecked();
    expect(screen.getByRole("checkbox", {
      name: /Archived/,
    })).not.toBeChecked();
  });

  it("shows an 'all categories' property as assigned to this category", () => {
    render(<CategoryCustomProperties category={category} />);

    expect(screen.getByRole("checkbox", {
      name: /Everywhere/,
    })).toBeChecked();
  });

  it("drops the all-categories flag when an 'all categories' property is unassigned", () => {
    render(<CategoryCustomProperties category={category} />);

    fireEvent.click(screen.getByRole("checkbox", {
      name: /Everywhere/,
    }));

    expect(updateMutate).toHaveBeenCalledWith({
      id: "prop-all",
      input: {
        allCategories: false,
        categoryIds: ["cat-1"],
      },
    });
  });

  it("assigns the category when an unassigned property is toggled", () => {
    render(<CategoryCustomProperties category={category} />);

    fireEvent.click(screen.getByRole("checkbox", {
      name: /Archived/,
    }));

    expect(updateMutate).toHaveBeenCalledWith({
      id: "prop-unassigned",
      input: {
        allCategories: false,
        categoryIds: ["cat-1"],
      },
    });
  });

  it("unassigns the category when an assigned property is toggled", () => {
    render(<CategoryCustomProperties category={category} />);

    fireEvent.click(screen.getByRole("checkbox", {
      name: /Priority/,
    }));

    expect(updateMutate).toHaveBeenCalledWith({
      id: "prop-assigned",
      input: {
        allCategories: false,
        categoryIds: [],
      },
    });
  });
});
