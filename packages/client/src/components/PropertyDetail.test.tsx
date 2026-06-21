import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PropertyOptionsFields } from "./PropertyDetail";
import { makeCustomProperty } from "../test-utils/factories";

// PropertyOptionsFields dispatches on `property.type` to a per-type options sub-component via an
// exhaustive `Record<CustomPropertyType, …>`. These tests pin the per-type output the decomposition
// must preserve so the dispatch can't silently drop a type's fields.

afterEach(cleanup);

describe("PropertyOptionsFields", () => {
  it("renders nothing for calculate properties (no options)", () => {
    const {
      container,
    } = render(
      <PropertyOptionsFields
        property={makeCustomProperty({
          type: "calculate",
        })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the boolean options without an allow-default row", () => {
    render(
      <PropertyOptionsFields
        property={makeCustomProperty({
          type: "boolean",
          booleanLabelPreset: "true-false",
        })}
      />,
    );
    expect(screen.getByText("How Values Display")).toBeInTheDocument();
    expect(screen.getByText("True / False")).toBeInTheDocument();
    // Per-card display knobs moved to Card Display Rules; only a pointer row remains here.
    expect(screen.getByText("Per-card display")).toBeInTheDocument();
    expect(screen.queryByText("Hide label")).not.toBeInTheDocument();
    expect(screen.queryByText("Clickable in view")).not.toBeInTheDocument();
    expect(screen.queryByText("Allow default value")).not.toBeInTheDocument();
  });

  it("renders the rating-scale options", () => {
    render(
      <PropertyOptionsFields
        property={makeCustomProperty({
          type: "ratingScale",
          ratingMax: 3,
          ratingAllowZero: true,
        })}
      />,
    );
    expect(screen.getByText("Scale")).toBeInTheDocument();
    expect(screen.getByText("0 – 3 stars")).toBeInTheDocument();
    expect(screen.getByText("Half ratings")).toBeInTheDocument();
    expect(screen.getByText("Allow default value")).toBeInTheDocument();
  });

  it("renders the numeric options plus the allow-default row", () => {
    render(
      <PropertyOptionsFields
        property={makeCustomProperty({
          type: "number",
        })}
      />,
    );
    expect(screen.getByText("Range")).toBeInTheDocument();
    expect(screen.getByText("Number format")).toBeInTheDocument();
    expect(screen.getByText("Allow default value")).toBeInTheDocument();
  });

  it("renders the date-time capture and allow-default rows", () => {
    render(
      <PropertyOptionsFields
        property={makeCustomProperty({
          type: "datetime",
          dateTimeFormat: "datetime",
        })}
      />,
    );
    expect(screen.getByText("Captures")).toBeInTheDocument();
    expect(screen.getByText("Date & time")).toBeInTheDocument();
    expect(screen.getByText("Allow default value")).toBeInTheDocument();
  });

  it.each(["image", "file"] as const)("renders only the allow-default row for %s", (type) => {
    render(
      <PropertyOptionsFields
        property={makeCustomProperty({
          type,
        })}
      />,
    );
    expect(screen.getByText("Allow default value")).toBeInTheDocument();
    expect(screen.queryByText("Range")).not.toBeInTheDocument();
    expect(screen.queryByText("Captures")).not.toBeInTheDocument();
  });
});
