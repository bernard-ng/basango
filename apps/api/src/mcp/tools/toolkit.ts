export const readOnlyAnnotations = {
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
  readOnlyHint: true,
} as const;

export function result(data: unknown) {
  return {
    content: [{ text: JSON.stringify(data) ?? "null", type: "text" as const }],
  };
}
