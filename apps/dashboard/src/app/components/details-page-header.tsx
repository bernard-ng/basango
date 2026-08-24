import type { ReactNode } from "react";

type DetailsPageHeaderProps = {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow: string;
  identifier?: string;
  title: ReactNode;
};

export function DetailsPageHeader({
  actions,
  description,
  eyebrow,
  identifier,
  title,
}: DetailsPageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight wrap-break-word">{title}</h1>
        {description ? <div className="mt-2">{description}</div> : null}
        {identifier ? (
          <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{identifier}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
