import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChoicesCheckboxList } from "./ChoicesCheckboxList";

import { makeCustomProperty } from "@/test-utils/factories";

const prop = makeCustomProperty({
  id: "tags",
  name: "Tags",
  type: "choices",
  description: "Pick some",
  choicesItems: [
    {
      label: "Red",
      value: "red",
    },
    {
      label: "Green",
      value: "green",
    },
  ],
});

describe("ChoicesCheckboxList", () => {
  it("renders a checkbox per choice item, checking the selected ones", () => {
    render(
      <ChoicesCheckboxList
        property={prop}
        fieldId="f"
        selectedValues={["green"]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("checkbox", {
      name: "Red",
    })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("checkbox", {
      name: "Green",
    })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Pick some")).toBeInTheDocument();
  });

  it("adds a value when an unchecked box is toggled on", () => {
    const onChange = vi.fn();
    render(
      <ChoicesCheckboxList
        property={prop}
        fieldId="f"
        selectedValues={["green"]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", {
      name: "Red",
    }));
    expect(onChange).toHaveBeenCalledWith(["green", "red"]);
  });

  it("removes a value when a checked box is toggled off", () => {
    const onChange = vi.fn();
    render(
      <ChoicesCheckboxList
        property={prop}
        fieldId="f"
        selectedValues={["red", "green"]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", {
      name: "Green",
    }));
    expect(onChange).toHaveBeenCalledWith(["red"]);
  });

  it("omits the description paragraph when the property has none", () => {
    render(
      <ChoicesCheckboxList
        property={makeCustomProperty({
          ...prop,
          description: null,
        })}
        fieldId="f"
        selectedValues={[]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByText("Pick some")).not.toBeInTheDocument();
  });
});
