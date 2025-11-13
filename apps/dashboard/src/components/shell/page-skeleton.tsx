import { Skeleton } from "@basango/ui/components/skeleton";

type Props = {
  dashboard?: boolean;
  details?: boolean;
};

const DashboardSkeleton = () => {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="container mx-auto space-y-10">
        <div className="space-y-2 mt-4">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[550px]" />
        </div>
        <div className="space-y-2 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Skeleton className="h-[500px] w-full" />
        </div>
        <div className="mb-8 flex items-center justify-between space-y-6"></div>
      </div>
    </div>
  );
};

const ListSkeleton = () => {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="container mx-auto space-y-10">
        <div className="space-y-2 mt-4">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[550px]" />
        </div>
        <div className="space-y-2 mt-4">
          <div className="space-y-2 mt-4 flex justify-between">
            <div className="flex justify-between gap-4">
              <Skeleton className="h-9 w-[380px]" />
              <Skeleton className="h-9 w-[150px]" />
            </div>
            <Skeleton className="h-9 w-[150px]" />
          </div>
          <Skeleton className="h-[500px] w-full" />
        </div>
        <div className="mb-8 flex items-center justify-between space-y-6"></div>
      </div>
    </div>
  );
};

const DetailsSkeleton = () => {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="container mx-auto space-y-10">
        <div className="space-y-2 mt-4">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[550px]" />
        </div>
        <div className="space-y-2 mt-4">
          <div className="space-y-2 mt-4 flex justify-between">
            <div className="flex justify-between gap-4">
              <Skeleton className="h-9 w-[380px]" />
            </div>
            <div className="flex justify-between gap-2">
              <Skeleton className="h-9 w-[150px]" />
              <Skeleton className="h-9 w-[150px]" />
              <Skeleton className="h-9 w-[150px]" />
            </div>
          </div>
          <Skeleton className="h-1 w-full mt-4" />
          <Skeleton className="h-[100px] w-[700px] my-8" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="grid grid-cols-3 gap-4" key={index}>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="mb-8 flex items-center justify-between space-y-6"></div>
      </div>
    </div>
  );
};

export const PageSkeleton = (props: Props) => {
  if (props.dashboard) return <DashboardSkeleton />;
  if (props.details) return <DetailsSkeleton />;
  return <ListSkeleton />;
};
