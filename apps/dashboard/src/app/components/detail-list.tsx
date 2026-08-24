import type { ReactNode } from "react";

type DetailsSectionProps = {
  children: ReactNode;
  title: string;
};

type DetailProps = {
  children: ReactNode;
  label: string;
};

export function DetailsSection({ children, title }: DetailsSectionProps) {
  return (
    <section className="grid content-start gap-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <dl className="grid gap-2">{children}</dl>
    </section>
  );
}

export function Detail({ children, label }: DetailProps) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <dt className="text-sm text-foreground">{label}</dt>
      <dd className="min-w-0 wrap-break-word text-sm text-muted-foreground">{children}</dd>
    </div>
  );
}
