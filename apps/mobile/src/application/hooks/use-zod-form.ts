import { zodResolver } from "@hookform/resolvers/zod";
import { type FieldValues, type Resolver, type UseFormProps, useForm } from "react-hook-form";
import type { z } from "zod";

export function useZodForm<TSchema extends z.ZodType<FieldValues, FieldValues>>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.infer<TSchema>>, "resolver">,
) {
  return useForm<z.infer<TSchema>>({
    ...options,
    resolver: zodResolver(schema) as unknown as Resolver<z.infer<TSchema>>,
  });
}
