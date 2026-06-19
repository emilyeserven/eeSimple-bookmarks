import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/autofill")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/autofill") throw redirect({ to: "/autofill/" });
  },
  component: () => <Outlet />,
});
