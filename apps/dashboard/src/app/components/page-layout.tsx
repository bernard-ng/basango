import { PageIntroduction } from "@basango/ui/components/page-introduction";
import type { ReactNode } from "react";

type PageLayoutProps = {
  actions?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  title?: ReactNode;
  toolbar?: ReactNode;
};

export function PageLayout({ actions, children, description, title, toolbar }: PageLayoutProps) {
  return (
    <main className="@container/main flex flex-col gap-6 pb-4">
      {title || actions ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {title ? <PageIntroduction description={description} title={title} /> : null}
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {toolbar}
      {children}
    </main>
  );
}
