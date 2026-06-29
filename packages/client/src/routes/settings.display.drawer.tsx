import { createFileRoute } from "@tanstack/react-router";

import { SidebarSettings } from "../components/SidebarSettings";

export const Route = createFileRoute("/settings/display/drawer")({
  component: DisplayDrawerPage,
});

function DisplayDrawerPage() {
  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Drawer</h3>
        <p className="text-sm text-muted-foreground">
          Control how the right-hand drawer opens.
        </p>
      </div>
      <SidebarSettings />
    </section>
  );
}
