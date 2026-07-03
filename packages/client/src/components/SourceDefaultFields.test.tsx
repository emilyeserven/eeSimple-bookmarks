import type { ComboboxOption } from "./Combobox";
import type { TreeComboboxOption } from "./TreeMultiCombobox";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SourceDefaultFields } from "./SourceDefaultFields";

// Isolate the picker pair from the inline-create modals' network hooks.
vi.mock("./AddCategoryModal", () => ({
  AddCategoryModal: ({
    open,
  }: { open: boolean }) =>
    open ? <div data-testid="add-category-modal" /> : null,
}));
vi.mock("./AddMediaTypeModal", () => ({
  AddMediaTypeModal: ({
    open,
  }: { open: boolean }) =>
    open ? <div data-testid="add-media-type-modal" /> : null,
}));

const categoryOptions: ComboboxOption[] = [
  {
    value: "cat-1",
    label: "Articles",
  },
  {
    value: "cat-2",
    label: "Videos",
  },
];
const mediaTypeOptions: TreeComboboxOption[] = [{
  value: "mt-1",
  label: "Blog",
}];

function renderFields(overrides: Partial<Parameters<typeof SourceDefaultFields>[0]> = {}) {
  const onCategoryChange = vi.fn();
  const onMediaTypeChange = vi.fn();
  render(
    <SourceDefaultFields
      initialCategoryId={null}
      initialMediaTypeId={null}
      categoryOptions={categoryOptions}
      mediaTypeOptions={mediaTypeOptions}
      onCategoryChange={onCategoryChange}
      onMediaTypeChange={onMediaTypeChange}
      note="Applied automatically."
      {...overrides}
    />,
  );
  return {
    onCategoryChange,
    onMediaTypeChange,
  };
}

describe("SourceDefaultFields", () => {
  it("renders both pickers with their labels and the note", () => {
    renderFields();
    expect(screen.getByRole("combobox", {
      name: "Category",
    })).toBeInTheDocument();
    expect(screen.getByRole("combobox", {
      name: "Media type",
    })).toBeInTheDocument();
    expect(screen.getByText("Applied automatically.")).toBeInTheDocument();
  });

  it("honors custom labels", () => {
    renderFields({
      categoryLabel: "Default category",
      mediaTypeLabel: "Default media type",
    });
    expect(screen.getByRole("combobox", {
      name: "Default category",
    })).toBeInTheDocument();
    expect(screen.getByRole("combobox", {
      name: "Default media type",
    })).toBeInTheDocument();
  });

  it("shows the initially-selected category on the trigger", () => {
    renderFields({
      initialCategoryId: "cat-2",
    });
    expect(screen.getByRole("combobox", {
      name: "Category",
    })).toHaveTextContent("Videos");
  });

  it("persists a category selection via onCategoryChange", () => {
    const {
      onCategoryChange,
    } = renderFields();
    fireEvent.click(screen.getByRole("combobox", {
      name: "Category",
    }));
    fireEvent.click(screen.getByRole("option", {
      name: "Articles",
    }));
    expect(onCategoryChange).toHaveBeenCalledWith("cat-1");
  });

  it("opens the inline create-category modal from the picker without persisting", () => {
    const {
      onCategoryChange,
    } = renderFields();
    fireEvent.click(screen.getByRole("combobox", {
      name: "Category",
    }));
    fireEvent.click(screen.getByRole("button", {
      name: /Create category/,
    }));
    expect(screen.getByTestId("add-category-modal")).toBeInTheDocument();
    expect(onCategoryChange).not.toHaveBeenCalled();
  });
});
