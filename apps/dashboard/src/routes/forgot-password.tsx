import { createFileRoute } from "@tanstack/react-router";

import { ForgotPasswordPage } from "#dashboard/features/identity/auth/pages/forgot-password-page";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [{ title: "Forgot password | Basango Dashboard" }],
  }),
});
