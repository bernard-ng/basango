import { useQuery } from "@tanstack/react-query";
import { ScrollView } from "react-native";
import { Spinner } from "tamagui";

import { useTRPC } from "#mobile/application/trpc/client";
import { Button } from "#mobile/ui/components/button";

type ArticleCategoryFilterProps = {
  onChange: (categoryId: string | undefined) => void;
  selectedCategoryId?: string;
};

export function ArticleCategoryFilter({
  onChange,
  selectedCategoryId,
}: ArticleCategoryFilterProps) {
  const trpc = useTRPC();
  const categories = useQuery(trpc.public.categories.list.queryOptions());

  if (categories.isPending) {
    return <Spinner alignSelf="flex-start" color="$primary" marginVertical="$3" size="small" />;
  }

  if (categories.isError) {
    return (
      <Button alignSelf="flex-start" onPress={() => void categories.refetch()} variant="ghost">
        Réessayer les catégories
      </Button>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ gap: 8 }}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      <CategoryButton
        isSelected={selectedCategoryId === undefined}
        label="Tout"
        onPress={() => onChange(undefined)}
      />
      {categories.data.map((category) => (
        <CategoryButton
          isSelected={selectedCategoryId === category.id}
          key={category.id}
          label={category.name}
          onPress={() => onChange(category.id)}
        />
      ))}
    </ScrollView>
  );
}

type CategoryButtonProps = {
  isSelected: boolean;
  label: string;
  onPress: () => void;
};

function CategoryButton({ isSelected, label, onPress }: CategoryButtonProps) {
  return (
    <Button
      accessibilityLabel={`Filtrer par ${label}`}
      accessibilityState={{ selected: isSelected }}
      borderRadius="$10"
      onPress={onPress}
      paddingHorizontal="$4"
      size="$3"
      variant={isSelected ? "primary" : "secondary"}
    >
      {label}
    </Button>
  );
}
