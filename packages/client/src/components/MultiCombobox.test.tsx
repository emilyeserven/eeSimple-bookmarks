import type { ComboboxOption } from "./Combobox";
import type { EntityName } from "@eesimple/types";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MultiCombobox } from "./MultiCombobox";

/** A minimal language-labelled name for combobox option fixtures. */
function nm(value: string): EntityName {
  return {
    id: value,
    language: {
      id: value,
      name: value,
      slug: value,
      isoCode: null,
    },
    value,
    isPrimary: false,
    sortOrder: 0,
  };
}

const options: ComboboxOption[] = [
  {
    value: "video",
    label: "Video",
  },
  {
    value: "audio",
    label: "Audio",
  },
];

describe("MultiCombobox", () => {
  it("toggles options on and off", () => {
    const onValuesChange = vi.fn();
    render(
      <MultiCombobox
        options={options}
        values={[]}
        onValuesChange={onValuesChange}
        aria-label="Media types"
      />,
    );

    fireEvent.click(screen.getByRole("combobox", {
      name: "Media types",
    }));
    fireEvent.click(screen.getByRole("option", {
      name: "Video",
    }));
    expect(onValuesChange).toHaveBeenCalledWith(["video"]);
  });

  it("shows an option's secondary name after its label in the dropdown", () => {
    const secondaryNameOptions: ComboboxOption[] = [
      {
        value: "parasite",
        label: "기생충",
        names: [nm("Parasite")],
      },
    ];
    render(
      <MultiCombobox
        options={secondaryNameOptions}
        values={[]}
        onValuesChange={vi.fn()}
        aria-label="Movie"
      />,
    );

    fireEvent.click(screen.getByRole("combobox", {
      name: "Movie",
    }));
    const option = screen.getByRole("option");
    expect(option).toHaveTextContent("기생충");
    expect(option).toHaveTextContent("Parasite");
  });

  it("filters options by their secondary name value", () => {
    const secondaryNameOptions: ComboboxOption[] = [
      {
        value: "parasite",
        label: "기생충",
        names: [nm("Parasite")],
      },
      {
        value: "spirited",
        label: "千と千尋の神隠し",
        names: [nm("Spirited Away")],
      },
    ];
    render(
      <MultiCombobox
        options={secondaryNameOptions}
        values={[]}
        onValuesChange={vi.fn()}
        aria-label="Movie"
      />,
    );

    fireEvent.click(screen.getByRole("combobox", {
      name: "Movie",
    }));
    fireEvent.change(screen.getByPlaceholderText("Search…"), {
      target: {
        value: "Parasite",
      },
    });

    expect(screen.getByText("기생충")).toBeInTheDocument();
    expect(screen.queryByText("千と千尋の神隠し")).not.toBeInTheDocument();
  });
});
