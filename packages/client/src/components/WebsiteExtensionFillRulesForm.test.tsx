import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WebsiteExtensionFillRulesForm } from "./WebsiteExtensionFillRulesForm";
import { makeCustomProperty, makeWebsite } from "../test-utils/factories";

// The form reads custom properties (to name a target) and an update mutation (auto-save). Stub both
// so the test focuses on the read-only ↔ edit toggle without a live API or QueryClient.
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
  ],
});

describe("WebsiteExtensionFillRulesForm", () => {
  it("opens read-only with full rule detail and no editor controls", () => {
    render(<WebsiteExtensionFillRulesForm website={website} />);

    // Full detail is shown read-only: the label, the resolved property name, selector, filter, transform.
    expect(screen.getByText("Print length")).toBeInTheDocument();
    expect(screen.getByText("Page progress")).toBeInTheDocument();
    expect(screen.getByText("._statBlockTitle_1ckth_86 > *")).toBeInTheDocument();
    expect(screen.getByText("Sibling text contains \"PRINT LENGTH:\"")).toBeInTheDocument();
    expect(screen.getByText("First number")).toBeInTheDocument();

    // The editable builder is not mounted yet.
    expect(screen.queryByRole("button", {
      name: "Add extraction rule",
    })).not.toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Edit",
    })).toBeInTheDocument();
  });

  it("reveals the editor after clicking Edit, and returns to read-only on Done", () => {
    render(<WebsiteExtensionFillRulesForm website={website} />);

    fireEvent.click(screen.getByRole("button", {
      name: "Edit",
    }));

    // The live editor is now mounted (Add + Done controls present).
    expect(screen.getByRole("button", {
      name: "Add extraction rule",
    })).toBeInTheDocument();
    const done = screen.getByRole("button", {
      name: "Done",
    });

    fireEvent.click(done);

    // Back to read-only: the Edit button returns and the editor is gone.
    expect(screen.getByRole("button", {
      name: "Edit",
    })).toBeInTheDocument();
    expect(screen.queryByRole("button", {
      name: "Add extraction rule",
    })).not.toBeInTheDocument();
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
  });
});
