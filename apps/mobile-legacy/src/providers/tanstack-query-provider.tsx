import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";

export const queryClient = new QueryClient();

export const TanstackQueryProvider = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
