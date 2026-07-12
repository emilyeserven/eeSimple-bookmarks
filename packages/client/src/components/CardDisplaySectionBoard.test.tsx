import type { CardDisplayFields } from "../lib/cardDisplaySectionMutations";
import type { CardDisplaySection } from "@eesimple/types";

import { emptyCardImageCorners } from "@eesimple/types";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CardDisplaySectionBoard } from "./CardDisplaySectionBoard";
import { renderWithRouter } from "../test-utils/router";

/** A board value with a single body section holding the Tags field. */
function tagsBoardValue(): CardDisplayFields {
  const section: CardDisplaySection = {
    key: "main",
    title: "Main",
    form: "stacked",
    layout: {
      mode: "flex",
    },
    fields: [{
      key: "tags",
    }],
  };
  return {
    sections: [section],
    imageCorners: emptyCardImageCorners(),
  };
}

/** Read the tags placement from an onChange payload. */
function tagsPlacement(value: CardDisplayFields) {
  return value.sections[0].fields.find(f => f.key === "tags");
}

describe("CardDisplaySectionBoard term-display controls", () => {
  it("edits Max terms from a popover (not a menu), so the number input works", async () => {
    const onChange = vi.fn();
    await renderWithRouter(
      <CardDisplaySectionBoard
        value={tagsBoardValue()}
        onChange={onChange}
        properties={[]}
        idPrefix="test"
      />,
    );

    // The term-display controls live behind their own popover trigger, separate from the "Field options" menu.
    fireEvent.click(screen.getByLabelText("Term display options for Tags"));

    const maxTerms = await screen.findByRole("spinbutton");
    // The input is in a popover, not a role="menu" — so typing/interacting isn't swallowed by menu typeahead.
    expect(maxTerms.closest("[role=\"menu\"]")).toBeNull();

    fireEvent.change(maxTerms, {
      target: {
        value: "3",
      },
    });
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls.at(-1)?.[0] as CardDisplayFields;
    expect(tagsPlacement(lastCall)?.maxTerms).toBe(3);
  });

  it("toggles Count only from the popover", async () => {
    const onChange = vi.fn();
    await renderWithRouter(
      <CardDisplaySectionBoard
        value={tagsBoardValue()}
        onChange={onChange}
        properties={[]}
        idPrefix="test"
      />,
    );

    fireEvent.click(screen.getByLabelText("Term display options for Tags"));
    fireEvent.click(await screen.findByRole("checkbox"));

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls.at(-1)?.[0] as CardDisplayFields;
    expect(tagsPlacement(lastCall)?.collapseToCount).toBe(true);
  });
});
