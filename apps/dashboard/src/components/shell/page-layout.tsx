import React from "react";

interface PageProps {
  children: React.ReactNode;
  title?: string | React.ReactNode;
  leading?: string | React.ReactNode;
}

export const PageLayout = (props: React.PropsWithChildren<PageProps>) => {
  const { title, leading, children } = props;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="container mx-auto">
        {title && (
          <div className="mb-8 flex items-center justify-between space-y-4">
            <div>
              <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight text-balance flex items-center gap-2 justify-start">
                {title}
              </h1>
              {leading && (
                <p className="text-muted-foreground text-lg wrap-break-words">{leading}</p>
              )}
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
