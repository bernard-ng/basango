import { Link } from "@tanstack/react-router";
import { NewspaperIcon } from "lucide-react";
import type { ReactNode } from "react";

type AuthPageLayoutProps = {
  children: ReactNode;
};

type AuthPanelProps = {
  children: ReactNode;
  description: ReactNode;
  title: ReactNode;
};

function AuthBrand() {
  return (
    <Link
      className="self-center rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      to="/"
    >
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <NewspaperIcon aria-hidden="true" className="size-6" />
      </span>
      <span className="sr-only">Basango Dashboard home</span>
    </Link>
  );
}

export function AuthPanel({ children, description, title }: AuthPanelProps) {
  return (
    <section aria-labelledby="auth-page-title" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-balance font-semibold text-2xl" id="auth-page-title">
          {title}
        </h1>
        <p className="max-w-sm text-center text-muted-foreground text-pretty text-sm">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10 text-foreground md:px-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <AuthBrand />
        {children}
        <p className="w-full max-w-sm self-center px-4 text-center text-muted-foreground text-sm leading-5 text-balance">
          Access is restricted to authorized Basango administrators.
        </p>
      </div>
    </main>
  );
}
