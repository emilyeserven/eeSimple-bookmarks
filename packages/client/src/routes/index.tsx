import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Save your bookmarks</h1>
      <p className="text-slate-600">
        eeSimple Bookmarks is a self-deployable app for keeping tabs on your favorite links. Head to the
        {" "}
        <Link
          to="/bookmarks"
          className="
            font-medium text-blue-600
            hover:underline
          "
        >
          Bookmarks
        </Link>
        {" "}
        page to add your first one.
      </p>
    </section>
  );
}
