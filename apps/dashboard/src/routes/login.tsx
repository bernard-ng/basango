import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "#dashboard/features/identity/auth/pages/login-page";

export const Route = createFileRoute("/login")({
  validateSearch: (search): { return_to?: string } =>
    typeof search.return_to === "string" ? { return_to: search.return_to } : {},
  head: () => ({
    meta: [{ title: "Login | Basango Dashboard" }],
  }),
  component: LoginRoute,
});

function LoginRoute() {
  const { return_to: returnTo } = Route.useSearch();

  return <LoginPage returnTo={returnTo} />;
}
