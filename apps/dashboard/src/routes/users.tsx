import { createFileRoute } from "@tanstack/react-router";

import { requireAdminSession } from "#dashboard/app/auth/route-guards";
import { UsersPage } from "#dashboard/features/identity/users/pages/users-page";

export const Route = createFileRoute("/users")({
  beforeLoad: ({ location }) => requireAdminSession(location.href),
  head: () => ({
    meta: [{ title: "Users | Basango Dashboard" }],
  }),
  component: UsersPage,
});
