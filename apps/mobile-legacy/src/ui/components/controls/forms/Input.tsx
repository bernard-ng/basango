import { IconProps } from "@tamagui/helpers-icon";
import React, { useMemo } from "react";
import {
  ColorTokens,
  GetProps,
  Label,
  SizeTokens,
  styled,
  Input as TamaguiInput,
  XStack,
  YStack,
} from "tamagui";

import { Caption } from "@/ui/components/typography";

const StyledInput = styled(TamaguiInput, {
  backgroundColor: "transparent",
  borderWidth: 0,
  flex: 1,
  placeholderTextColor: "$gray8",
  size: "$large",
});

export type InputProps = GetProps<typeof StyledInput> & {
  label?: string;
  caption?: string;
  error?: string;
  leadingAdornment?: React.ComponentType<IconProps & { size?: SizeTokens; color?: ColorTokens }>;
  trailingAdornment?: React.ReactNode;
  onChangeText?: (text: string) => void;
  id?: string;
};

export const Input = (props: InputProps) => {
  const { label, caption, error, leadingAdornment, trailingAdornment, onChangeText, id, ...rest } =
    props;

  const isInvalid = !!error;
  const leadingAdornmentComponent = useMemo(() => {
    return leadingAdornment ? (
      <XStack paddingLeft="$3" style={{ alignItems: "center", justifyContent: "center" }}>
        {React.createElement(leadingAdornment, {
          color: "$gray9",
          size: "$1",
        })}
      </XStack>
    ) : undefined;
  }, [leadingAdornment]);

  return (
    <YStack gap="$1">
      <YStack>
        {label && (
          <Label color={isInvalid ? "$red9" : undefined} fontWeight="bold" htmlFor={id}>
            {label}
          </Label>
        )}

        <XStack
          alignItems="center"
          backgroundColor="$gray4"
          borderColor={isInvalid ? "$red9" : "transparent"}
          borderRadius="$4"
          borderWidth="$0.5"
          focusStyle={{
            borderColor: "$accent8",
          }}
          pressStyle={{
            borderColor: "$accent8",
          }}
        >
          {leadingAdornmentComponent}
          <StyledInput id={id} onChangeText={onChangeText} {...rest} />
          {trailingAdornment}
        </XStack>
      </YStack>

      {caption && !isInvalid && <Caption>{caption}</Caption>}
      {isInvalid && error && <Caption color="$red9">{error}</Caption>}
    </YStack>
  );
};
