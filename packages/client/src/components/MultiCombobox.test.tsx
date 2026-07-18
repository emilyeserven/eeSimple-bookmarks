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

  it("clears every selected value via the trigger's clear button", () => {
    const onValuesChange = vi.fn();
    render(
      <MultiCombobox
        options={options}
        values={["video", "audio"]}
        onValuesChange={onValuesChange}
        aria-label="Media types"
      />,
    );

    fireEvent.click(screen.getByRole("button", {
      name: "Clear all",
    }));
    expect(onValuesChange).toHaveBeenCalledWith([]);
  });

  it("hides the clear button when nothing is selected", () => {
    render(
      <MultiCombobox
        options={options}
        values={[]}
        onValuesChange={vi.fn()}
        aria-label="Media types"
      />,
    );

    expect(screen.queryByRole("button", {
      name: "Clear all",
    })).not.toBeInTheDocument();
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

  it("shows a selected option's secondary name in the collapsed trigger", () => {
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
        values={["parasite"]}
        onValuesChange={vi.fn()}
        aria-label="Movie"
      />,
    );

    const trigger = screen.getByRole("combobox", {
      name: "Movie",
    });
    expect(trigger).toHaveTextContent("기생충");
    expect(trigger).toHaveTextContent("Parasite");
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
