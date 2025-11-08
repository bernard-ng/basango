import { Button, ButtonProps } from "tamagui";

type IconButtonProps = {
  onPress: () => void;
};

export const IconButton = (props: IconButtonProps & ButtonProps) => {
  const { onPress, ...rest } = props;

  return (
    <Button
      alignSelf="flex-start"
      borderRadius="$12"
      chromeless
      height="$4"
      onPress={onPress}
      size="$4"
      width="$4"
      {...rest}
    />
  );
};
