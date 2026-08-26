import { createFileRoute } from "@tanstack/react-router";

import { ResetPasswordPage } from "#dashboard/features/identity/auth/pages/reset-password-page";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search): { token?: string } =>
    typeof search.token === "string" ? { token: search.token } : {},
  head: () => ({
    meta: [{ title: "Reset password | Basango Dashboard" }],
  }),
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  const { token } = Route.useSearch();

  return <ResetPasswordPage token={token} />;
}
