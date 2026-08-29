import { ChevronRightIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import type { GetProps } from "tamagui";
import { XStack, YStack } from "tamagui";

import { Text } from "#mobile/ui/components/text";
import { useAppColors } from "#mobile/ui/theme";

type GroupedSectionProps = {
  children: ReactNode;
  footer?: string;
  title?: string;
};

export function GroupedSection({ children, footer, title }: GroupedSectionProps) {
  return (
    <YStack gap="$1.5">
      {title ? (
        <Text color="$mutedColor" fontSize="$2" marginHorizontal="$4" textTransform="uppercase">
          {title}
        </Text>
      ) : null}
      <YStack backgroundColor="$card" borderRadius="$5" overflow="hidden">
        {children}
      </YStack>
      {footer ? (
        <Text color="$mutedColor" fontSize="$2" marginHorizontal="$4">
          {footer}
        </Text>
      ) : null}
    </YStack>
  );
}

type GroupedRowProps = {
  accessibilityHint?: string;
  destructive?: boolean;
  icon?: ReactNode;
  label: string;
  onPress?: () => void;
  showSeparator?: boolean;
  subtitle?: string;
  trailing?: ReactNode;
  value?: string;
};

export function GroupedRow({
  accessibilityHint,
  destructive = false,
  icon,
  label,
  onPress,
  showSeparator = false,
  subtitle,
  trailing,
  value,
}: GroupedRowProps) {
  const colors = useAppColors();
  const isCenteredAction = Boolean(onPress && destructive && !icon && !value);

  return (
    <XStack
      accessibilityHint={accessibilityHint}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityRole={onPress ? "button" : undefined}
      accessible={Boolean(onPress)}
      alignItems="center"
      backgroundColor="$card"
      gap="$3"
      justifyContent={isCenteredAction ? "center" : "flex-start"}
      minHeight={52}
      onPress={onPress}
      paddingHorizontal="$4"
      pressStyle={onPress ? { backgroundColor: "$surface" } : undefined}
    >
      {icon}
      <YStack flex={isCenteredAction ? undefined : 1} gap="$0.5" paddingVertical="$2.5">
        <Text color={destructive ? "$danger" : "$color"} fontSize={15} numberOfLines={1}>
          {label}
        </Text>
        {subtitle ? (
          <Text fontSize="$2" numberOfLines={2} variant="caption">
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      {value ? (
        <Text
          color="$mutedColor"
          flexShrink={1}
          fontSize="$4"
          maxWidth="54%"
          numberOfLines={1}
          textAlign="right"
        >
          {value}
        </Text>
      ) : null}
      {trailing}
      {onPress && !isCenteredAction && !trailing ? (
        <ChevronRightIcon color={colors.muted} size={16} strokeWidth={1.8} />
      ) : null}
      {showSeparator ? (
        <YStack
          backgroundColor="$separator"
          bottom={0}
          height={StyleSheet.hairlineWidth}
          left={icon ? 60 : 16}
          position="absolute"
          right={0}
        />
      ) : null}
    </XStack>
  );
}

type GroupedIconProps = GetProps<typeof YStack> & {
  children: ReactNode;
};

export function GroupedIcon({ children, ...props }: GroupedIconProps) {
  return (
    <YStack
      alignItems="center"
      backgroundColor="$primary"
      borderRadius="$3"
      height={30}
      justifyContent="center"
      width={30}
      {...props}
    >
      {children}
    </YStack>
  );
}
