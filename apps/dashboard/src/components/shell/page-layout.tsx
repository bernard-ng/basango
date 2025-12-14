import { cn } from "@basango/ui/lib/utils";
import React from "react";

import { PageHeader } from "#dashboard/components/shell/page-header";

interface PageProps {
  children: React.ReactNode;
  title?: string | React.ReactNode;
  header?: React.ReactNode;
  headersNumber?: 1 | 2;
}

const isEmptyHeader = (header: React.ReactNode | undefined): boolean => {
  if (!header) return true;

  if (React.isValidElement(header) && header.type === React.Fragment) {
    const props = header.props as { children?: React.ReactNode };

    if (!props.children) return true;

    if (Array.isArray(props.children) && props.children.length === 0) {
      return true;
    }
  }

  return false;
};

const height = {
  1: "h-[calc(100svh-40px)] lg:h-[calc(100svh-56px)]",
  2: "h-[calc(100svh-80px)] lg:h-[calc(100svh-96px)]",
};

export const PageLayout = (props: React.PropsWithChildren<PageProps>) => {
  const { title, header = <PageHeader title={title} />, headersNumber = 1, children } = props;
  return (
    <div className="h-svh overflow-hidden lg:p-2 w-full">
      <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start h-full w-full">
        {header}
        <div
          className={cn(
            "overflow-auto w-full py-2 px-6",
            isEmptyHeader(header) ? "h-full" : height[headersNumber as keyof typeof height],
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
