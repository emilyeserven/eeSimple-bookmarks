import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderPropertyScalarInput } from "./PropertyScalarInput";

import { makeCustomProperty } from "@/test-utils/factories";

function renderScalar(property: ReturnType<typeof makeCustomProperty>, overrides: {
  numberInputs?: Record<string, string>;
  dateTimeInputs?: Record<string, string>;
  onNumberChange?: (id: string, v: string) => void;
  onDateTimeChange?: (id: string, v: string) => void;
} = {}) {
  return renderPropertyScalarInput({
    property,
    htmlId: `id-${property.id}`,
    numberInputs: overrides.numberInputs ?? {},
    dateTimeInputs: overrides.dateTimeInputs ?? {},
    onNumberChange: overrides.onNumberChange ?? vi.fn(),
    onDateTimeChange: overrides.onDateTimeChange ?? vi.fn(),
  });
}

describe("renderPropertyScalarInput", () => {
  it("renders a number input for a number property and reports changes", () => {
    const onNumberChange = vi.fn();
    const prop = makeCustomProperty({
      id: "count",
      name: "Count",
      type: "number",
    });
    const element = renderScalar(prop, {
      numberInputs: {
        count: "7",
      },
      onNumberChange,
    });
    expect(element).not.toBeNull();
    render(element);
    const input = screen.getByLabelText("Count") as HTMLInputElement;
    expect(input.value).toBe("7");
    fireEvent.change(input, {
      target: {
        value: "9",
      },
    });
    expect(onNumberChange).toHaveBeenCalledWith("count", "9");
  });

  it("appends the plural unit to a number property's label", () => {
    const prop = makeCustomProperty({
      id: "len",
      name: "Length",
      type: "number",
      unitPlural: "pages",
    });
    render(renderScalar(prop));
    expect(screen.getByText(/Length/)).toHaveTextContent("Length (pages)");
  });

  it("renders a datetime picker for a datetime property", () => {
    const prop = makeCustomProperty({
      id: "due",
      name: "Due",
      type: "datetime",
    });
    const element = renderScalar(prop);
    expect(element).not.toBeNull();
    render(element);
    expect(screen.getByLabelText("Due")).toBeInTheDocument();
  });

  it("renders a star rating for a ratingScale property", () => {
    const prop = makeCustomProperty({
      id: "score",
      name: "Score",
      type: "ratingScale",
      ratingMax: 5,
    });
    const element = renderScalar(prop, {
      numberInputs: {
        score: "3",
      },
    });
    expect(element).not.toBeNull();
    render(element);
    expect(screen.getByText("Score")).toBeInTheDocument();
  });

  it("returns null for a property type it does not handle (boolean)", () => {
    const prop = makeCustomProperty({
      id: "done",
      type: "boolean",
    });
    expect(renderScalar(prop)).toBeNull();
  });

  it("returns null for a text property", () => {
    const prop = makeCustomProperty({
      id: "note",
      type: "text",
    });
    expect(renderScalar(prop)).toBeNull();
  });
});
