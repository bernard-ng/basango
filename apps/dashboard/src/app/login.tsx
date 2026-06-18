import { createFileRoute } from "@tanstack/react-router";

import { LoginForm } from "#dashboard/components/forms/login-form";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Login | Basango Dashboard" }],
  }),
  validateSearch: (search): { return_to?: string } =>
    typeof search.return_to === "string" ? { return_to: search.return_to } : {},
});

function LoginPage() {
  const { return_to: returnTo } = Route.useSearch();

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm returnTo={returnTo} />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <img
          alt="Login background"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          src="https://images.pexels.com/photos/30690932/pexels-photo-30690932.jpeg"
        />
      </div>
    </div>
  );
}
