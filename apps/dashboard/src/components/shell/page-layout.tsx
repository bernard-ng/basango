import React from "react";

import { PageHeader } from "#dashboard/components/shell/page-header";

interface PageProps {
  children: React.ReactNode;
  title?: string | React.ReactNode;
  header?: React.ReactNode;
}

export const PageLayout = (props: React.PropsWithChildren<PageProps>) => {
  const { title, header = <PageHeader title={title} />, children } = props;
  return (
    <div className="h-svh overflow-hidden lg:p-2 w-full">
      <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start h-full w-full">
        {header}
        <div className="overflow-auto w-full h-[calc(100svh-40px)] lg:h-[calc(100svh-56px)] p-4 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};
