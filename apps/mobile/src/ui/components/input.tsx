import type { ReactNode } from "react";
import { useState } from "react";
import type { GetProps } from "tamagui";
import { Input as TamaguiInput, XStack, YStack } from "tamagui";

import { Text } from "#mobile/ui/components/text";

export type InputProps = GetProps<typeof TamaguiInput> & {
  error?: string;
  label?: string;
  trailing?: ReactNode;
};

export function Input({
  error,
  label,
  multiline,
  onBlur,
  onFocus,
  trailing,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const isDisabled = props.disabled === true;

  return (
    <YStack gap="$1.5">
      {label ? (
        <Text color="$mutedColor" fontSize="$3" variant="label">
          {label}
        </Text>
      ) : null}
      <XStack
        alignItems="center"
        backgroundColor="$surface"
        borderColor={error ? "$danger" : isFocused ? "$primary" : "$borderColor"}
        borderRadius="$4"
        borderWidth={1}
        minHeight={multiline ? 96 : 44}
        opacity={isDisabled ? 0.45 : 1}
        paddingHorizontal="$3"
      >
        <TamaguiInput
          accessibilityLabel={props.accessibilityLabel ?? label}
          backgroundColor="transparent"
          borderWidth={0}
          clearButtonMode={multiline ? "never" : (props.clearButtonMode ?? "while-editing")}
          color="$color"
          flex={1}
          fontFamily="$body"
          fontSize={15}
          lineHeight={20}
          minHeight={multiline ? 94 : 42}
          multiline={multiline}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          paddingHorizontal={0}
          paddingVertical={multiline ? "$3" : 0}
          placeholderTextColor="$mutedColor"
          textAlignVertical={multiline ? "top" : "center"}
          {...props}
        />
        {trailing}
      </XStack>
      {error ? (
        <Text accessibilityRole="alert" color="$danger" variant="caption">
          {error}
        </Text>
      ) : null}
    </YStack>
  );
}
