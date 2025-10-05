import { GetProps, Label, styled, TextArea as TamaguiTextArea, XStack, YStack } from "tamagui";

import { withController } from "@/ui/components/controls/forms/withController";
import { Caption } from "@/ui/components/typography";

const StyledTextArea = styled(TamaguiTextArea, {
    size: "$4",
    flex: 1,
    minHeight: 100,
    borderWidth: 0,
    placeholderTextColor: "$gray8",
    backgroundColor: "transparent",
});

type TextAreaProps = GetProps<typeof StyledTextArea> & {
    label?: string;
    caption?: string;
    error?: string;
    onChangeText?: (text: string) => void;
    id?: string;
};

export const TextArea = (props: TextAreaProps) => {
    const { label, caption, error, onChangeText, id, ...rest } = props;

    const isInvalid = !!error;

    return (
        <YStack gap="$2">
            {label && (
                <Label htmlFor={id} fontWeight="bold" color={isInvalid ? "$red9" : undefined}>
                    {label}
                </Label>
            )}

            <XStack
                alignItems="flex-start"
                backgroundColor="$gray4"
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
                <StyledTextArea id={id} onChangeText={onChangeText} {...rest} />
            </XStack>

            {caption && !isInvalid && <Caption>{caption}</Caption>}
            {isInvalid && error && <Caption color="$red9">{error}</Caption>}
        </YStack>
    );
};

export const FormTextArea = withController<TextAreaProps>(TextArea);
