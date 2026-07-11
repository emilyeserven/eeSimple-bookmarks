import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WebsiteExtensionFillRulesForm } from "./WebsiteExtensionFillRulesForm";
import { makeCustomProperty, makeWebsite } from "../test-utils/factories";

// The form reads custom properties (to name a target) and an update mutation (auto-save). Stub both
// so the test focuses on each rule's own read-only ↔ edit toggle without a live API or QueryClient.
vi.mock("../hooks/useCustomProperties", () => ({
  useCustomProperties: () => ({
    data: [makeCustomProperty({
      id: "prop-progress",
      name: "Page progress",
      slug: "page-progress",
      type: "number",
    })],
    isLoading: false,
  }),
}));
vi.mock("../hooks/useWebsites", () => ({
  useUpdateWebsite: () => ({
    mutate: vi.fn(),
  }),
}));
// The built-in-rules panel below the editor pulls in react-query hooks; it's not under test here.
vi.mock("./extensionFill/WebsiteBuiltInFillRules", () => ({
  WebsiteBuiltInFillRules: () => null,
}));

const website = makeWebsite({
  id: "site-1",
  siteName: "O'Reilly Learning",
  slug: "oreilly-learning",
  extensionFillRules: [
    {
      id: "print-length",
      label: "Print length",
      target: {
        kind: "customProperty",
        propertyId: "prop-progress",
      },
      extract: {
        selector: "._statBlockTitle_1ckth_86 > *",
        filters: [{
          kind: "siblingText",
          match: {
            mode: "contains",
            value: "PRINT LENGTH:",
          },
        }],
        transform: [{
          kind: "number",
        }],
      },
    },
    {
      id: "title-text",
      label: "Title text",
      target: {
        kind: "field",
        field: "title",
      },
      extract: {
        selector: ".title",
      },
    },
  ],
});

describe("WebsiteExtensionFillRulesForm", () => {
  it("opens every rule read-only with full detail and its own Edit button", () => {
    render(<WebsiteExtensionFillRulesForm website={website} />);

    // Full detail is shown read-only: the label, the resolved property name, selector, filter, transform.
    expect(screen.getByText("Print length")).toBeInTheDocument();
    expect(screen.getByText("Page progress")).toBeInTheDocument();
    expect(screen.getByText("._statBlockTitle_1ckth_86 > *")).toBeInTheDocument();
    expect(screen.getByText("Sibling text contains \"PRINT LENGTH:\"")).toBeInTheDocument();
    expect(screen.getByText("First number")).toBeInTheDocument();
    expect(screen.getByText("Title text")).toBeInTheDocument();

    // Neither rule is being edited, so no field inputs are mounted for either rule.
    expect(screen.queryByLabelText("Selector")).not.toBeInTheDocument();

    // Every rule has its own Edit button — two rules, two buttons.
    expect(screen.getAllByRole("button", {
      name: "Edit",
    })).toHaveLength(2);

    // Delete sits in each read-only row's header; no bottom Delete button is mounted yet.
    expect(screen.getAllByRole("button", {
      name: "Remove rule",
    })).toHaveLength(2);
    expect(screen.queryByRole("button", {
      name: "Delete rule",
    })).not.toBeInTheDocument();

    // Add extraction rule is always available, not gated behind entering an edit mode.
    expect(screen.getByRole("button", {
      name: "Add extraction rule",
    })).toBeInTheDocument();
  });

  it("edits only the rule whose Edit button was clicked, leaving the others read-only", () => {
    render(<WebsiteExtensionFillRulesForm website={website} />);

    const [firstEdit, secondEdit] = screen.getAllByRole("button", {
      name: "Edit",
    });
    fireEvent.click(firstEdit);

    // Only one rule's fields are mounted.
    expect(screen.getByLabelText("Selector")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Selector")).toHaveLength(1);

    // The edited rule's Delete moved out of the header to a destructive button below its fields; the
    // other (still read-only) rule keeps Delete in its header.
    expect(screen.getAllByRole("button", {
      name: "Remove rule",
    })).toHaveLength(1);
    expect(screen.getByRole("button", {
      name: "Delete rule",
    })).toBeInTheDocument();

    // The other rule is untouched: still read-only, still showing its own Edit button.
    expect(screen.getByText("Title text")).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Edit",
    })).toBeInTheDocument();

    // Add extraction rule stays available while a rule is being edited.
    expect(screen.getByRole("button", {
      name: "Add extraction rule",
    })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", {
      name: "Done",
    }));

    // Back to read-only: both Edit buttons return, no field inputs remain, Delete is back in both headers.
    expect(screen.getAllByRole("button", {
      name: "Edit",
    })).toHaveLength(2);
    expect(screen.queryByLabelText("Selector")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", {
      name: "Remove rule",
    })).toHaveLength(2);
    expect(screen.queryByRole("button", {
      name: "Delete rule",
    })).not.toBeInTheDocument();

    expect(secondEdit).toBeInTheDocument();
  });

  it("renders a taxonomyDirect rule's summary read-only", () => {
    render(
      <WebsiteExtensionFillRulesForm
        website={makeWebsite({
          id: "site-3",
          extensionFillRules: [
            {
              id: "channel-avatar",
              label: "Channel avatar",
              target: {
                kind: "taxonomyDirect",
                association: "youtubeChannel",
                resolve: {
                  mode: "url",
                },
                field: "image",
              },
              extract: {
                selector: "img#avatar",
                read: {
                  kind: "attr",
                  name: "src",
                },
              },
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("Channel avatar")).toBeInTheDocument();
    // The target summary from describeFillTarget: association · field (resolution source).
    expect(screen.getByText("YouTube channel · Image (from URL)")).toBeInTheDocument();
  });

  it("shows the empty state when a site has no rules", () => {
    render(
      <WebsiteExtensionFillRulesForm
        website={makeWebsite({
          id: "site-2",
          extensionFillRules: [],
        })}
      />,
    );

    expect(screen.getByText("No extension fill rules yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Add extraction rule",
    })).toBeInTheDocument();
  });
});
