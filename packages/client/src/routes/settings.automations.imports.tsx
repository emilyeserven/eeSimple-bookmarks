import { Link, createFileRoute } from "@tanstack/react-router";

import { ImportsBlacklistCard } from "../components/ImportsSettings";

export const Route = createFileRoute("/settings/automations/imports")({
  component: ImportsPage,
});

function ImportsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Imports</h2>
        <p className="text-sm text-muted-foreground">
          Manage the imports blacklist.
          {" "}
          <Link
            to="/import-rules"
            className="underline"
          >Import Rules
          </Link>
          {" "}
          let you auto-approve, reject, or block items by URL pattern.
        </p>
      </div>
      <ImportsBlacklistCard />
    </section>
  );
}
