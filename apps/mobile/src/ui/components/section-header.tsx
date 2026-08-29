import { ArrowRightIcon } from "lucide-react-native";
import { Button as TamaguiButton, XStack } from "tamagui";

import { Text } from "#mobile/ui/components/text";
import { useAppColors } from "#mobile/ui/theme";

type SectionHeaderProps = {
  actionLabel?: string;
  onAction?: () => void;
  title: string;
};

export function SectionHeader({ actionLabel = "Voir tout", onAction, title }: SectionHeaderProps) {
  const colors = useAppColors();

  return (
    <XStack
      alignItems="center"
      gap="$4"
      justifyContent="space-between"
      paddingVertical="$2"
      width="100%"
    >
      <Text flexShrink={1} fontSize="$6" fontWeight="bold" marginRight="$2" numberOfLines={1}>
        {title}
      </Text>
      {onAction ? (
        <TamaguiButton
          accessibilityLabel={`${actionLabel} : ${title}`}
          accessibilityRole="button"
          backgroundColor="transparent"
          borderWidth={0}
          height={44}
          iconAfter={<ArrowRightIcon color={colors.primary} size={20} strokeWidth={1.8} />}
          onPress={onAction}
          paddingHorizontal={0}
          pressStyle={{ opacity: 0.55, scale: 0.98 }}
        >
          <Text color="$primary" fontWeight="500">
            {actionLabel}
          </Text>
        </TamaguiButton>
      ) : null}
    </XStack>
  );
}
