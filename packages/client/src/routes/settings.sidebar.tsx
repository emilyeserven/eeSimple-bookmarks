import { createFileRoute } from "@tanstack/react-router";

import { SidebarSettings } from "../components/SidebarSettings";

export const Route = createFileRoute("/settings/sidebar")({
  component: SidebarPage,
});

function SidebarPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Sidebar</h2>
        <p className="text-sm text-muted-foreground">
          Control how the right-hand sidebar opens.
        </p>
      </div>
      <SidebarSettings />
    </section>
  );
}
