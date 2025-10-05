import { Button, ButtonProps } from "tamagui";

type IconButtonProps = {
    onPress: () => void;
};

export const IconButton = (props: IconButtonProps & ButtonProps) => {
    const { onPress, ...rest } = props;

    return (
        <Button
            chromeless
            alignSelf="flex-start"
            size="$4"
            width="$4"
            height="$4"
            borderRadius="$12"
            onPress={onPress}
            {...rest}
        />
    );
};
