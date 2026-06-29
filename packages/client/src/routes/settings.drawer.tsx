import { createFileRoute } from "@tanstack/react-router";

import { SidebarSettings } from "../components/SidebarSettings";

export const Route = createFileRoute("/settings/drawer")({
  component: SidebarPage,
});

function SidebarPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Drawer</h2>
        <p className="text-sm text-muted-foreground">
          Control how the right-hand drawer opens.
        </p>
      </div>
      <SidebarSettings />
    </section>
  );
}
