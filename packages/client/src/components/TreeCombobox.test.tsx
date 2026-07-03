import type { TreeComboboxOption } from "./TreeMultiCombobox";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TreeCombobox } from "./TreeCombobox";

/** Places > { Japan > Kyushu > Fukuoka, Korea > Busan }. */
const tree: TreeComboboxOption[] = [
  {
    value: "places",
    label: "Places",
    children: [
      {
        value: "japan",
        label: "Japan",
        children: [
          {
            value: "kyushu",
            label: "Kyushu",
            children: [{
              value: "fukuoka",
              label: "Fukuoka",
            }],
          },
        ],
      },
      {
        value: "korea",
        label: "Korea",
        children: [{
          value: "busan",
          label: "Busan",
        }],
      },
    ],
  },
];

function open(name = "Media type") {
  fireEvent.click(screen.getByRole("combobox", {
    name,
  }));
}

describe("TreeCombobox", () => {
  it("keeps a matching leaf's ancestor chain visible while searching, pruning other branches", () => {
    render(
      <TreeCombobox
        options={tree}
        onValueChange={vi.fn()}
        aria-label="Media type"
      />,
    );

    open();
    fireEvent.change(screen.getByPlaceholderText("Search…"), {
      target: {
        value: "fukuoka",
      },
    });

    // The match and every ancestor stay visible (hierarchy preserved, not flattened).
    for (const label of ["Places", "Japan", "Kyushu", "Fukuoka"]) {
      expect(screen.getByRole("option", {
        name: label,
      })).toBeInTheDocument();
    }
    // The unrelated branch is pruned away.
    expect(screen.queryByRole("option", {
      name: "Korea",
    })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", {
      name: "Busan",
    })).not.toBeInTheDocument();
  });

  it("clears the selection when the active option is chosen again", () => {
    const onValueChange = vi.fn();
    render(
      <TreeCombobox
        options={tree}
        value="places"
        onValueChange={onValueChange}
        aria-label="Media type"
      />,
    );

    open();
    fireEvent.click(screen.getByRole("option", {
      name: "Places",
    }));
    expect(onValueChange).toHaveBeenCalledWith(undefined);
  });

  it("always shows the leading option and emits its value when selected", () => {
    const onValueChange = vi.fn();
    render(
      <TreeCombobox
        options={tree}
        leadingOption={{
          value: "__none__",
          label: "— Leave unchanged —",
        }}
        onValueChange={onValueChange}
        aria-label="Media type"
      />,
    );

    open();
    // Visible even after a search that matches no tree node.
    fireEvent.change(screen.getByPlaceholderText("Search…"), {
      target: {
        value: "zzz",
      },
    });
    const leading = screen.getByRole("option", {
      name: "— Leave unchanged —",
    });
    expect(leading).toBeInTheDocument();

    fireEvent.click(leading);
    expect(onValueChange).toHaveBeenCalledWith("__none__");
  });

  it("runs the create action from the pinned footer", () => {
    const onSelect = vi.fn();
    render(
      <TreeCombobox
        options={tree}
        onValueChange={vi.fn()}
        aria-label="Media type"
        createOption={{
          label: "Create media type",
          onSelect,
        }}
      />,
    );

    open();
    fireEvent.click(screen.getByText("Create media type"));
    expect(onSelect).toHaveBeenCalled();
  });
});
