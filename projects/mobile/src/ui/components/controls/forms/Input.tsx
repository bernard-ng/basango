import React, { useMemo } from "react";

import { IconProps } from "@tamagui/helpers-icon";
import { ColorTokens, GetProps, Input as TamaguiInput, Label, SizeTokens, styled, XStack, YStack } from "tamagui";

import { Caption } from "@/ui/components/typography";

const StyledInput = styled(TamaguiInput, {
    size: "$large",
    flex: 1,
    borderWidth: 0,
    placeholderTextColor: "$gray8",
    backgroundColor: "transparent",
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
    const { label, caption, error, leadingAdornment, trailingAdornment, onChangeText, id, ...rest } = props;

    const isInvalid = !!error;
    const leadingAdornmentComponent = useMemo(() => {
        return leadingAdornment ? (
            <XStack paddingLeft="$3" style={{ justifyContent: "center", alignItems: "center" }}>
                {React.createElement(leadingAdornment, {
                    size: "$1",
                    color: "$gray9",
                })}
            </XStack>
        ) : undefined;
    }, [leadingAdornment]);

    return (
        <YStack gap="$1">
            <YStack>
                {label && (
                    <Label htmlFor={id} fontWeight="bold" color={isInvalid ? "$red9" : undefined}>
                        {label}
                    </Label>
                )}

                <XStack
                    backgroundColor="$gray4"
                    alignItems="center"
                    borderRadius="$4"
                    borderWidth="$0.5"
                    borderColor={isInvalid ? "$red9" : "transparent"}
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
