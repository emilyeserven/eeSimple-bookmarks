import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p className="text-muted-foreground">
        This is the starter app. Replace this page and the example Items feature with your own.
      </p>
      <Button asChild>
        <Link to="/items">Open Items</Link>
      </Button>
    </div>
  );
}
