import { createFileRoute } from "@tanstack/react-router";

import { ConnectorsSettings } from "../components/ConnectorsSettings";

export const Route = createFileRoute("/settings/advanced/connectors")({
  component: ConnectorsPage,
});

function ConnectorsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Connectors</h2>
        <p className="text-sm text-muted-foreground">
          The external data sources used to auto-fill bookmark metadata, what each provides, and which
          optional providers are currently active.
        </p>
      </div>
      <ConnectorsSettings />
    </section>
  );
}
