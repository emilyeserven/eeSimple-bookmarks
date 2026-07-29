import { createFileRoute, redirect } from "@tanstack/react-router";

/** The Websites taxonomy lives at `/taxonomies/websites`; keep the old URL working. */
export const Route = createFileRoute("/settings/websites")({
  beforeLoad: () => {
    throw redirect({
      to: "/taxonomies/websites",
    });
  },
});
