import { ArrowLeft } from "@tamagui/lucide-icons";
import { Button, ButtonProps } from "tamagui";

type BackButtonProps = {
    onPress: () => void;
};

export const BackButton = (props: BackButtonProps & ButtonProps) => {
    const { onPress, ...rest } = props;

    return (
        <Button
            chromeless
            alignSelf="flex-start"
            size="$4"
            width="$4"
            height="$4"
            borderRadius="$12"
            // backgroundColor="$gray6"
            icon={<ArrowLeft size="$1" />}
            onPress={onPress}
            {...rest}
        />
    );
};
