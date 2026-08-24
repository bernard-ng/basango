import { parseAsString, useQueryState } from "nuqs";

export function useCategoryFilterParams(paramKey = "category") {
  const [selectedCategory, setSelectedCategory] = useQueryState(paramKey, parseAsString);

  return {
    selectedCategory,
    setSelectedCategory,
  };
}
