import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  retainSearchParams,
  useNavigate,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePanelControls } from "./usePanelControls";

import { validateDrawerSearch } from "@/lib/drawerSearch";

/** Probe that surfaces the current panel params and drives the controls. */
function Probe() {
  const {
    dCT, dCId, openTag, close,
  } = usePanelControls();
  const navigate = useNavigate();

  return (
    <div>
      <span data-testid="state">{`${dCT ?? "-"}:${dCId ?? "-"}`}</span>
      <button
        type="button"
        onClick={() => openTag("t1")}
      >
        open
      </button>
      <button
        type="button"
        onClick={close}
      >
        close
      </button>
      <button
        type="button"
        onClick={() =>
          // The test router declares `/other`, which the app's global route types don't know about.
          void (navigate as (opts: { to: string }) => Promise<void>)({
            to: "/other",
          })}
      >
        go
      </button>
    </div>
  );
}

function renderRouter(initialEntry: string) {
  const rootRoute = createRootRoute({
    validateSearch: validateDrawerSearch,
    search: {
      middlewares: [retainSearchParams(["dCT", "dCId"])],
    },
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: Probe,
  });
  const otherRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/other",
    component: Probe,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, otherRoute]),
    history: createMemoryHistory({
      initialEntries: [initialEntry],
    }),
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe("usePanelControls", () => {
  it("opens and closes the panel via search params", async () => {
    renderRouter("/");
    expect(await screen.findByTestId("state")).toHaveTextContent("-:-");

    screen.getByText("open").click();
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("tag:t1"));

    screen.getByText("close").click();
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("-:-"));
  });

  it("hydrates the panel from the initial URL", async () => {
    renderRouter("/?dCT=tag&dCId=seeded");
    expect(await screen.findByTestId("state")).toHaveTextContent("tag:seeded");
  });

  it("retains the panel params across navigation", async () => {
    renderRouter("/?dCT=tag&dCId=keep");
    (await screen.findByText("go")).click();
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("tag:keep"));
  });
});
