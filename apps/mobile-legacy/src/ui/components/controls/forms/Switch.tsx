import { GetProps, Label, Switch as TamaguiSwitch, XStack, YStack } from "tamagui";

import { withController } from "@/ui/components/controls/forms/withController";
import { Caption } from "@/ui/components/typography";

type SwitchProps = GetProps<typeof TamaguiSwitch> & {
    label: string;
    description?: string;
    isChecked: boolean;
    onCheckedChange: (checked: boolean) => void;
    id?: string;
};

export const Switch = (props: SwitchProps) => {
    const { label, description, isChecked, onCheckedChange, id, ...rest } = props;

    return (
        <XStack alignItems="center" gap="$10" justifyContent="space-between" width="100%">
            <YStack flex={1} gap="$1">
                <Label fontWeight="bold" htmlFor={id}>
                    {label}
                </Label>
                {description && <Caption>{description}</Caption>}
            </YStack>
            <TamaguiSwitch id={id} checked={isChecked} onCheckedChange={onCheckedChange} size="$3" {...rest}>
                <TamaguiSwitch.Thumb animation="bouncy" />
            </TamaguiSwitch>
        </XStack>
    );
};

export const FormSwitch = withController<SwitchProps>(Switch);
