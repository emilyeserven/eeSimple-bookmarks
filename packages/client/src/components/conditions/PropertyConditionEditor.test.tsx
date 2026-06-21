import type { CustomProperty, PropertyCondition } from "@eesimple/types";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PropertyConditionEditor } from "./PropertyConditionEditor";
import { makeCustomProperty } from "../../test-utils/factories";

const numberProp = makeCustomProperty({
  id: "p-num",
  name: "Price",
  slug: "price",
  type: "number",
  numberMin: 0,
  numberMax: 100,
});
const dateProp = makeCustomProperty({
  id: "p-date",
  name: "Published",
  slug: "published",
  type: "datetime",
  dateTimeFormat: "date",
});
const fileProp = makeCustomProperty({
  id: "p-file",
  name: "Attachment",
  slug: "attachment",
  type: "file",
});
const boolProp = makeCustomProperty({
  id: "p-bool",
  name: "Favorite",
  slug: "favorite",
  type: "boolean",
});

function renderEditor(properties: CustomProperty[], value: PropertyCondition[] = []) {
  const onChange = vi.fn<(next: PropertyCondition[]) => void>();
  render(
    <PropertyConditionEditor
      value={value}
      properties={properties}
      categories={[]}
      selectedCategoryIds={[]}
      onChange={onChange}
    />,
  );
  return onChange;
}

/** The mode `Select` for a named property row (its trigger is a `combobox` next to the label). */
function modeSelectFor(name: string): HTMLElement {
  const label = screen.getByText(name);
  const row = label.closest("div.justify-between") as HTMLElement;
  return within(row).getByRole("combobox");
}

/** Open a Radix Select and click the option with the given label. */
function chooseMode(name: string, optionLabel: string): void {
  // jsdom can't deliver Radix's pointer-driven open, but it opens on a keyboard ArrowDown.
  const trigger = modeSelectFor(name);
  trigger.focus();
  fireEvent.keyDown(trigger, {
    key: "ArrowDown",
  });
  fireEvent.click(screen.getByRole("option", {
    name: optionLabel,
  }));
}

describe("PropertyConditionEditor — value-kind dispatch", () => {
  it("renders one row per enabled property with the kind-appropriate default mode", () => {
    renderEditor([numberProp, dateProp, fileProp, boolProp]);
    for (const name of ["Price", "Published", "Attachment", "Favorite"]) {
      expect(modeSelectFor(name)).toHaveTextContent("Any");
    }
  });

  it("shows 'No custom properties yet.' when nothing is enabled", () => {
    renderEditor([makeCustomProperty({
      id: "p-off",
      enabled: false,
    })]);
    expect(screen.getByText("No custom properties yet.")).toBeInTheDocument();
  });

  it("derives the current mode and reveals the range slider for a number range condition", () => {
    renderEditor(
      [numberProp],
      [{
        type: "property",
        propertyId: "p-num",
        predicate: {
          valueKind: "number",
          predicate: {
            kind: "range",
            min: 10,
            max: 40,
          },
        },
      }],
    );
    expect(modeSelectFor("Price")).toHaveTextContent("In range");
    // Two slider thumbs appear only when the range control is rendered.
    expect(screen.getAllByRole("slider")).toHaveLength(2);
  });

  it("derives the current mode and reveals the date range fields for a datetime range condition", () => {
    renderEditor(
      [dateProp],
      [{
        type: "property",
        propertyId: "p-date",
        predicate: {
          valueKind: "datetime",
          predicate: {
            kind: "range",
            from: "2026-01-01",
            to: "2026-12-31",
          },
        },
      }],
    );
    expect(modeSelectFor("Published")).toHaveTextContent("In range");
    // The from/to date-range fields appear only when the range control is rendered.
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
  });

  it("derives 'Yes' for a boolean value condition and 'Missing' for a file presence condition", () => {
    renderEditor(
      [boolProp, fileProp],
      [
        {
          type: "property",
          propertyId: "p-bool",
          predicate: {
            valueKind: "boolean",
            predicate: {
              kind: "value",
              value: true,
            },
          },
        },
        {
          type: "property",
          propertyId: "p-file",
          predicate: {
            valueKind: "file",
            predicate: {
              kind: "presence",
              mode: "missing",
            },
          },
        },
      ],
    );
    expect(modeSelectFor("Favorite")).toHaveTextContent("Yes");
    expect(modeSelectFor("Attachment")).toHaveTextContent("Missing");
  });
});

describe("PropertyConditionEditor — emits the predicate for the chosen mode", () => {
  it("emits a boolean value predicate when 'Yes' is selected", () => {
    const onChange = renderEditor([boolProp]);

    chooseMode("Favorite", "Yes");

    expect(onChange).toHaveBeenCalledWith([{
      type: "property",
      propertyId: "p-bool",
      predicate: {
        valueKind: "boolean",
        predicate: {
          kind: "value",
          value: true,
        },
      },
    }]);
  });

  it("emits a file presence predicate when 'Has value' is selected", () => {
    const onChange = renderEditor([fileProp]);

    chooseMode("Attachment", "Has value");

    expect(onChange).toHaveBeenCalledWith([{
      type: "property",
      propertyId: "p-file",
      predicate: {
        valueKind: "file",
        predicate: {
          kind: "presence",
          mode: "has",
        },
      },
    }]);
  });

  it("clears the condition when 'Any' is reselected", () => {
    const onChange = renderEditor(
      [numberProp],
      [{
        type: "property",
        propertyId: "p-num",
        predicate: {
          valueKind: "number",
          predicate: {
            kind: "presence",
            mode: "has",
          },
        },
      }],
    );

    chooseMode("Price", "Any");

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
