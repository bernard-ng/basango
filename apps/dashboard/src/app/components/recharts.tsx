import { Skeleton } from "@basango/ui/components/skeleton";
import { type ReactNode, Suspense, lazy } from "react";

type RechartsSuspenseProps = {
  children: ReactNode;
};

export const Area = lazy(() => import("recharts").then((module) => ({ default: module.Area })));
export const AreaChart = lazy(() =>
  import("recharts").then((module) => ({ default: module.AreaChart })),
);
export const Bar = lazy(() => import("recharts").then((module) => ({ default: module.Bar })));
export const BarChart = lazy(() =>
  import("recharts").then((module) => ({ default: module.BarChart })),
);
export const CartesianGrid = lazy(() =>
  import("recharts").then((module) => ({ default: module.CartesianGrid })),
);
export const Cell = lazy(() => import("recharts").then((module) => ({ default: module.Cell })));
export const Legend = lazy(() => import("recharts").then((module) => ({ default: module.Legend })));
export const Line = lazy(() => import("recharts").then((module) => ({ default: module.Line })));
export const LineChart = lazy(() =>
  import("recharts").then((module) => ({ default: module.LineChart })),
);
export const Pie = lazy(() => import("recharts").then((module) => ({ default: module.Pie })));
export const PieChart = lazy(() =>
  import("recharts").then((module) => ({ default: module.PieChart })),
);
export const ResponsiveContainer = lazy(() =>
  import("recharts").then((module) => ({ default: module.ResponsiveContainer })),
);
export const XAxis = lazy(() => import("recharts").then((module) => ({ default: module.XAxis })));
export const YAxis = lazy(() => import("recharts").then((module) => ({ default: module.YAxis })));

export function RechartsSuspense({ children }: RechartsSuspenseProps) {
  return (
    <Suspense fallback={<Skeleton aria-hidden className="h-full min-h-20 w-full" />}>
      {children}
    </Suspense>
  );
}
