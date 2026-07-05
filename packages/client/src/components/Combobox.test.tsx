import type { ComboboxOption } from "./Combobox";
import type { EntityName } from "@eesimple/types";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Combobox } from "./Combobox";

import { renderWithRouter } from "@/test-utils/router";

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
    value: "web",
    label: "web",
    depth: 0,
  },
  {
    value: "frontend",
    label: "frontend",
    depth: 1,
  },
  {
    value: "backend",
    label: "backend",
    depth: 1,
  },
];

describe("Combobox", () => {
  it("opens, filters by query, and selects an option", () => {
    const onValueChange = vi.fn();
    render(
      <Combobox
        options={options}
        onValueChange={onValueChange}
        aria-label="Topic"
      />,
    );

    // The trigger shows the placeholder until something is selected.
    const trigger = screen.getByRole("combobox", {
      name: "Topic",
    });
    fireEvent.click(trigger);

    const search = screen.getByPlaceholderText("Search…");
    fireEvent.change(search, {
      target: {
        value: "front",
      },
    });

    fireEvent.click(screen.getByRole("option", {
      name: "frontend",
    }));
    expect(onValueChange).toHaveBeenCalledWith("frontend");
  });

  it("renders an option's icon in the list and the trigger", () => {
    const iconOptions: ComboboxOption[] = [
      {
        value: "web",
        label: "web",
        icon: <span data-testid="web-icon" />,
      },
    ];
    render(
      <Combobox
        options={iconOptions}
        value="web"
        onValueChange={vi.fn()}
        aria-label="Topic"
      />,
    );

    // The selected option's icon shows in the trigger.
    expect(screen.getByTestId("web-icon")).toBeInTheDocument();

    // …and again inside the open list.
    fireEvent.click(screen.getByRole("combobox", {
      name: "Topic",
    }));
    expect(screen.getAllByTestId("web-icon").length).toBeGreaterThan(1);
  });

  it("shows an option's secondary name after its label, in the list and the trigger", async () => {
    const secondaryNameOptions: ComboboxOption[] = [
      {
        value: "fukuoka",
        label: "福岡県",
        names: [nm("Fukuoka Prefecture")],
      },
    ];
    await renderWithRouter(
      <Combobox
        options={secondaryNameOptions}
        value="fukuoka"
        onValueChange={vi.fn()}
        aria-label="Parent"
      />,
    );

    // The trigger renders both the real name and its de-emphasized secondary form.
    const trigger = screen.getByRole("combobox", {
      name: "Parent",
    });
    expect(trigger).toHaveTextContent("福岡県");
    expect(trigger).toHaveTextContent("Fukuoka Prefecture");

    // …and so does the option inside the open list.
    fireEvent.click(trigger);
    const option = screen.getByRole("option");
    expect(option).toHaveTextContent("福岡県");
    expect(option).toHaveTextContent("Fukuoka Prefecture");
  });

  it("filters options by their secondary form", async () => {
    const secondaryNameOptions: ComboboxOption[] = [
      {
        value: "fukuoka",
        label: "福岡県",
        names: [nm("Fukuoka Prefecture")],
      },
      {
        value: "tokyo",
        label: "東京都",
        names: [nm("Tokyo")],
      },
    ];
    await renderWithRouter(
      <Combobox
        options={secondaryNameOptions}
        onValueChange={vi.fn()}
        aria-label="Parent"
      />,
    );

    fireEvent.click(screen.getByRole("combobox", {
      name: "Parent",
    }));
    fireEvent.change(screen.getByPlaceholderText("Search…"), {
      target: {
        value: "Fukuoka",
      },
    });

    expect(screen.getByText("福岡県")).toBeInTheDocument();
    expect(screen.queryByText("東京都")).not.toBeInTheDocument();
  });

  it("clears the selection when the active option is chosen again", () => {
    const onValueChange = vi.fn();
    render(
      <Combobox
        options={options}
        value="web"
        onValueChange={onValueChange}
        aria-label="Topic"
      />,
    );

    fireEvent.click(screen.getByRole("combobox", {
      name: "Topic",
    }));
    fireEvent.click(screen.getByRole("option", {
      name: "web",
    }));
    expect(onValueChange).toHaveBeenCalledWith(undefined);
  });
});
