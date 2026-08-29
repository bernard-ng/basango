import { AlertCircleIcon, InboxIcon } from "lucide-react-native";
import { Spinner, YStack } from "tamagui";

import { Button } from "#mobile/ui/components/button";
import { Text } from "#mobile/ui/components/text";
import { useAppColors } from "#mobile/ui/theme";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Chargement…" }: LoadingStateProps) {
  return (
    <YStack alignItems="center" flex={1} gap="$3" justifyContent="center" padding="$8">
      <Spinner color="$primary" size="small" />
      <Text textAlign="center" variant="caption">
        {label}
      </Text>
    </YStack>
  );
}

type EmptyStateProps = {
  description: string;
  title: string;
};

export function EmptyState({ description, title }: EmptyStateProps) {
  const colors = useAppColors();

  return (
    <YStack alignItems="center" flex={1} gap="$3" justifyContent="center" padding="$8">
      <YStack
        alignItems="center"
        backgroundColor="$surface"
        borderRadius="$10"
        height={48}
        justifyContent="center"
        width={48}
      >
        <InboxIcon color={colors.muted} size={23} strokeWidth={1.7} />
      </YStack>
      <Text textAlign="center" variant="title">
        {title}
      </Text>
      <Text textAlign="center" variant="caption">
        {description}
      </Text>
    </YStack>
  );
}

type ErrorStateProps = {
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({
  description = "Une erreur est survenue. Réessayez dans un instant.",
  onRetry,
}: ErrorStateProps) {
  const colors = useAppColors();

  return (
    <YStack alignItems="center" flex={1} gap="$3" justifyContent="center" padding="$8">
      <AlertCircleIcon color={colors.muted} size={28} strokeWidth={1.7} />
      <Text textAlign="center" variant="title">
        Impossible de charger
      </Text>
      <Text textAlign="center" variant="caption">
        {description}
      </Text>
      {onRetry ? (
        <Button onPress={onRetry} variant="outline">
          Réessayer
        </Button>
      ) : null}
    </YStack>
  );
}
