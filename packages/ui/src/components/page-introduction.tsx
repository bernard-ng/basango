import type { ReactNode } from "react";

import { cn } from "../lib/utils";

type PageIntroductionProps = {
  className?: string;
  description?: ReactNode;
  title: ReactNode;
};

export function PageIntroduction({ className, description, title }: PageIntroductionProps) {
  return (
    <div className={cn("flex max-w-[72ch] flex-col gap-1", className)}>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
