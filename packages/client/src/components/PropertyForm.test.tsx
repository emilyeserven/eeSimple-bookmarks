import type { CreateCustomPropertyInput, CustomProperty } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PropertyForm } from "./PropertyForm";
import { renderWithRouter } from "../test-utils/router";
import { sampleCategories, sampleMediaTypes, sampleProperties } from "../test-utils/story-mocks";

// The form is data-in / callback-out: every taxonomy list is a prop and the only side effect is
// `onSubmit`. These tests pin the behavior the decomposition must preserve — that each Type renders
// its own options section, that seeded values survive the round-trip, and that submitting builds the
// expected payload — so the JSX can be split into child sections without changing behavior.

// sampleProperties order: [0] Priority (number), [1] Effort (number w/ units),
// [2] Score (calculate), [3] Reviewed (boolean).
const [, effortProperty, scoreProperty, reviewedProperty] = sampleProperties;

function numberProperty(): CustomProperty {
  return effortProperty;
}
function calculateProperty(): CustomProperty {
  return scoreProperty;
}
function booleanProperty(overrides: Partial<CustomProperty> = {}): CustomProperty {
  return {
    ...reviewedProperty,
    ...overrides,
  };
}

function renderForm(property: CustomProperty, section: Parameters<typeof PropertyForm>[0]["section"], onSubmit = vi.fn()) {
  return renderWithRouter(
    <PropertyForm
      mode="edit"
      categories={sampleCategories}
      mediaTypes={sampleMediaTypes}
      numberProperties={sampleProperties.filter(property => property.type === "number")}
      propertyGroups={[]}
      property={property}
      onSubmit={onSubmit}
      submitLabel="Save"
      idPrefix="test"
      section={section}
    />,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("propertyForm sections", () => {
  it("renders the number-options section seeded from the property", async () => {
    await renderForm(numberProperty(), "options");

    expect(screen.getByLabelText("Slider minimum")).toBeInTheDocument();
    expect(screen.getByLabelText("Slider maximum")).toBeInTheDocument();
    // Effort carries unit labels — they should be seeded into the inputs.
    expect(screen.getByLabelText("Unit (singular)")).toHaveValue("point");
    expect(screen.getByLabelText("Unit (plural)")).toHaveValue("points");
  });

  it("renders the boolean-options section, revealing custom labels for the custom preset", async () => {
    await renderForm(
      booleanProperty({
        booleanLabelPreset: "custom",
        booleanTrueLabel: "Read",
        booleanFalseLabel: "Unread",
      }),
      "options",
    );

    expect(screen.getByText("Show if false")).toBeInTheDocument();
    expect(screen.getByLabelText("True label")).toHaveValue("Read");
    expect(screen.getByLabelText("False label")).toHaveValue("Unread");
  });

  it("renders the calculate operands section", async () => {
    await renderForm(calculateProperty(), "options");

    expect(screen.getByText("Operands (summed)")).toBeInTheDocument();
    // The two number properties are offered as operands.
    expect(screen.getByText("Priority")).toBeInTheDocument();
    expect(screen.getByText("Effort")).toBeInTheDocument();
  });

  it("renders the categories section with the taxonomy checkboxes", async () => {
    await renderForm(numberProperty(), "categories");

    for (const category of sampleCategories) {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    }
  });

  it("renders only the requested section", async () => {
    await renderForm(numberProperty(), "general");

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    // The categories/options sections must not leak into a single-section render.
    expect(screen.queryByText("Operands (summed)")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Slider minimum")).not.toBeInTheDocument();
  });

  it("submits a payload built from the edited values", async () => {
    const onSubmit = vi.fn<(payload: CreateCustomPropertyInput) => void>();
    await renderForm(numberProperty(), "general", onSubmit);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: {
        value: "Effort renamed",
      },
    });
    fireEvent.click(screen.getByRole("button", {
      name: "Save",
    }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: "Effort renamed",
      type: "number",
      unitSingular: "point",
    });
  });
});
