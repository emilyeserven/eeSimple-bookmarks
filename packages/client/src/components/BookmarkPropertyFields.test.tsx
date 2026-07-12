import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SectionsPropertyField } from "./BookmarkPropertyFields";
import { makeCustomProperty } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

const property = makeCustomProperty({
  type: "sections",
  name: "Sections",
  slug: "sections",
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
  it("renders no import button when onImport is not provided", async () => {
    await renderWithRouter(
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

  it("calls onImport when clicked", async () => {
    const onImport = vi.fn();
    await renderWithRouter(
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

  it("disables the button while the import is pending", async () => {
    await renderWithRouter(
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
  it("renders existing child items and the add-sub-item control even when the property is not tiered", async () => {
    await renderWithRouter(
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

  it("appends a child when the add-sub-item control is clicked", async () => {
    const onChange = vi.fn();
    await renderWithRouter(
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

describe("SectionsPropertyField completed checkboxes", () => {
  it("checking a section cascades completed to its children", async () => {
    const onChange = vi.fn();
    await renderWithRouter(
      <SectionsPropertyField
        property={property}
        value={tieredValue}
        onChange={onChange}
      />,
    );

    // First "Completed" checkbox is the tier-1 section's; the second is the child's.
    fireEvent.click(screen.getAllByRole("checkbox", {
      name: /Completed/,
    })[0]);

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0];
    expect(next.sections[0].completed).toBe(true);
    expect(next.sections[0].children[0].completed).toBe(true);
  });

  it("checking a child touches only that child", async () => {
    const onChange = vi.fn();
    await renderWithRouter(
      <SectionsPropertyField
        property={property}
        value={tieredValue}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getAllByRole("checkbox", {
      name: /Completed/,
    })[1]);

    const next = onChange.mock.calls[0][0];
    expect(next.sections[0].completed).toBeUndefined();
    expect(next.sections[0].children[0].completed).toBe(true);
  });
});
