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
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {header}
      {children}
    </div>
  );
};
