import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SectionsPropertyField } from "./BookmarkPropertyFields";
import { makeCustomProperty } from "../test-utils/factories";

const property = makeCustomProperty({
  type: "sections",
  name: "Page Sections",
  slug: "page-sections",
  sectionsDefaultType: "page",
});

const emptyValue = {
  exhaustive: false,
  sections: [],
};

const tieredValue = {
  exhaustive: false,
  sections: [
    {
      id: "section-1",
      name: "Chapter 1",
      type: "page" as const,
      startValue: "1",
      children: [
        {
          id: "child-1",
          name: "Intro subsection",
          type: "page" as const,
          startValue: "2",
        },
      ],
    },
  ],
};

describe("SectionsPropertyField import button", () => {
  it("renders no import button when onImport is not provided", () => {
    render(
      <SectionsPropertyField
        property={property}
        value={emptyValue}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", {
      name: /Import from Kavita/,
    })).not.toBeInTheDocument();
  });

  it("calls onImport when clicked", () => {
    const onImport = vi.fn();
    render(
      <SectionsPropertyField
        property={property}
        value={emptyValue}
        onChange={vi.fn()}
        onImport={onImport}
      />,
    );

    fireEvent.click(screen.getByRole("button", {
      name: /Import from Kavita/,
    }));
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("disables the button while the import is pending", () => {
    render(
      <SectionsPropertyField
        property={property}
        value={emptyValue}
        onChange={vi.fn()}
        onImport={vi.fn()}
        isImportPending
      />,
    );

    expect(screen.getByRole("button", {
      name: /Import from Kavita/,
    })).toBeDisabled();
  });
});

describe("SectionsPropertyField second tier", () => {
  it("renders existing child items and the add-sub-item control even when the property is not tiered", () => {
    render(
      <SectionsPropertyField
        property={property}
        value={tieredValue}
        onChange={vi.fn()}
      />,
    );

    // The child's name renders in its own editable Name input.
    expect(screen.getByDisplayValue("Intro subsection")).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: /Add sub-item/,
    })).toBeInTheDocument();
  });

  it("appends a child when the add-sub-item control is clicked", () => {
    const onChange = vi.fn();
    render(
      <SectionsPropertyField
        property={property}
        value={tieredValue}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", {
      name: /Add sub-item/,
    }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0];
    expect(next.sections[0].children).toHaveLength(2);
    expect(next.sections[0].children[0].id).toBe("child-1");
  });
});
