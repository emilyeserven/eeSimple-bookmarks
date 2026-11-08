import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const {
    t,
  } = useTranslation();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">{t("Welcome")}</h1>
      <p className="text-muted-foreground">
        {t("This is the starter app. Replace this page and the example Items feature with your own.")}
      </p>
      <Button asChild>
        <Link to="/items">{t("Open Items")}</Link>
      </Button>
    </div>
  );
}
