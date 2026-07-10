import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ScanPipelineSettings } from "./ScanPipelineSettings";
import { makeScanPipelineReport } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

const mockUseScanPipeline = vi.fn();
vi.mock("../hooks/useScanPipeline", () => ({
  useScanPipeline: () => mockUseScanPipeline(),
}));

function mockReport() {
  mockUseScanPipeline.mockReturnValue({
    data: makeScanPipelineReport(),
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
    refetch: vi.fn(),
  });
}

describe("ScanPipelineSettings", () => {
  it("renders the full pipeline: stages, the parallel branch, badges, cache stats, and registries", async () => {
    mockReport();
    await renderWithRouter(<ScanPipelineSettings />, {
      paths: ["/settings/advanced/connectors"],
    });

    // A plain stage, a query-param-gated stage, and the metadata branch's two stages all render.
    expect(screen.getByText("URL validation")).toBeInTheDocument();
    expect(screen.getByText("Redirect resolution")).toBeInTheDocument();
    expect(screen.getByText("YouTube metadata")).toBeInTheDocument();
    expect(screen.getByText("Generic page metadata")).toBeInTheDocument();

    // Every GateBadge state is present: on (Active), off (Inactive), conditional (Conditional).
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Conditional").length).toBeGreaterThan(0);

    // The parallel fan-out and the branch chooser render.
    expect(screen.getByText("Page metadata")).toBeInTheDocument();
    expect(screen.getByText("Is the URL a YouTube video watch page?")).toBeInTheDocument();

    // Cache stats + registries cards render with live data.
    expect(screen.getByText("Scan cache")).toBeInTheDocument();
    expect(screen.getByText("Registries")).toBeInTheDocument();
    expect(screen.getByText("Vimeo")).toBeInTheDocument();
  });

  it("expands a stage to reveal its precedence chain, whose connector gate links to Connectors", async () => {
    mockReport();
    await renderWithRouter(<ScanPipelineSettings />, {
      paths: ["/settings/advanced/connectors"],
    });

    // The precedence chain (with its connector-gated source) is collapsed until the stage expands.
    expect(screen.queryByText("Browserless fallback")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Redirect resolution"));
    expect(screen.getByText("Browserless fallback")).toBeInTheDocument();

    const links = screen.getAllByRole("link", {
      name: "Open Connectors settings",
    });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/settings/advanced/connectors");
    }
  });

  it("shows an error message when the query fails", async () => {
    mockUseScanPipeline.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("boom"),
      isFetching: false,
      refetch: vi.fn(),
    });
    await renderWithRouter(<ScanPipelineSettings />);
    expect(screen.getByText(/Couldn't load the scan pipeline: boom/)).toBeInTheDocument();
  });
});
