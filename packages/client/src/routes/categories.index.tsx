import { createFileRoute } from "@tanstack/react-router";

import { CategoriesListingPage } from "../components/CategoriesListingPage";

export const Route = createFileRoute("/categories/")({
  component: CategoriesListingPage,
});
