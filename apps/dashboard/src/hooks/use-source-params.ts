import { parseAsBoolean, useQueryStates } from "nuqs";

export function useSourceParams() {
  const [params, setParams] = useQueryStates({
    createSource: parseAsBoolean,
  });

  return {
    ...params,
    setParams,
  };
}
