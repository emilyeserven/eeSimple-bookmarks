import { fireEvent, render, screen } from "@testing-library/react";
import { User } from "lucide-react";
import { describe, expect, it } from "vitest";

import { TaxonomyBadgeRow } from "./bookmarkCardTermBadges";

const people = ["Ann", "Bob", "Cy", "Dan", "Eve"];

function renderRow(maxTerms: number | null) {
  return render(
    <TaxonomyBadgeRow
      items={people}
      keyOf={name => name}
      icon={User}
      countLabel={count => `${count} people`}
      maxTerms={maxTerms}
      renderBadge={name => <span>{name}</span>}
    />,
  );
}

describe("TaxonomyBadgeRow +N more popover", () => {
  it("shows the first N terms inline and hides the rest behind a +N more trigger", () => {
    renderRow(2);
    expect(screen.getByText("Ann")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    // The overflow terms are not rendered until the popover is opened.
    expect(screen.queryByText("Cy")).not.toBeInTheDocument();
    expect(screen.queryByText("Dan")).not.toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Show 3 more",
    })).toBeInTheDocument();
  });

  it("reveals the hidden terms in a popover when the +N more badge is clicked", async () => {
    renderRow(2);
    fireEvent.click(screen.getByRole("button", {
      name: "Show 3 more",
    }));
    expect(await screen.findByText("Cy")).toBeInTheDocument();
    expect(screen.getByText("Dan")).toBeInTheDocument();
    expect(screen.getByText("Eve")).toBeInTheDocument();
  });

  it("renders every term with no +N more trigger when under the cap", () => {
    renderRow(null);
    for (const name of people) expect(screen.getByText(name)).toBeInTheDocument();
    expect(screen.queryByRole("button", {
      name: /more/,
    })).not.toBeInTheDocument();
  });
});
