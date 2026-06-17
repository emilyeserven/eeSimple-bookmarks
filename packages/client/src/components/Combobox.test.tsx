import type { ComboboxOption } from "./Combobox";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Combobox } from "./Combobox";

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
