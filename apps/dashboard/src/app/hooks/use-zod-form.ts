/** biome-ignore-all lint/suspicious/noExplicitAny: This is a hook file */
import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, type UseFormProps, useForm } from "react-hook-form";
import type { z } from "zod";

export const useZodForm = <T extends z.ZodType<any, any>>(
  schema: T,
  options?: Omit<UseFormProps<z.infer<T>>, "resolver">,
) => {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema) as unknown as Resolver<z.infer<T>, any, z.infer<T>>,
    ...options,
  });
};
