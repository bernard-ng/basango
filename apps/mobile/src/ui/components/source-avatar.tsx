import { YStack } from "tamagui";

import { Text } from "#mobile/ui/components/text";

type SourceAvatarProps = {
  name: string;
  size?: "comment" | "large" | "medium" | "small";
};

const avatarSizes = {
  comment: 32,
  large: 65,
  medium: 50,
  small: 20,
} as const;

const textSizes = {
  comment: 12,
  large: 18,
  medium: 15,
  small: 8,
} as const;

export function SourceAvatar({ name, size = "medium" }: SourceAvatarProps) {
  const initials = name
    .split(/[.\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase("fr-CD"))
    .join("");
  const dimension = avatarSizes[size];

  return (
    <YStack
      accessibilityLabel={name}
      accessibilityRole="image"
      alignItems="center"
      backgroundColor="$surface"
      borderColor="$borderColor"
      borderRadius={dimension / 2}
      borderWidth={1}
      height={dimension}
      justifyContent="center"
      width={dimension}
    >
      <Text color="$primary" fontSize={textSizes[size]} fontWeight="700">
        {initials || "B"}
      </Text>
    </YStack>
  );
}
