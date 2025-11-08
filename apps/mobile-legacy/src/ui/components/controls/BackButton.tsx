import { ArrowLeft } from "@tamagui/lucide-icons";
import { Button, ButtonProps } from "tamagui";

type BackButtonProps = {
  onPress: () => void;
};

export const BackButton = (props: BackButtonProps & ButtonProps) => {
  const { onPress, ...rest } = props;

  return (
    <Button
      alignSelf="flex-start"
      borderRadius="$12"
      chromeless
      height="$4"
      icon={<ArrowLeft size="$1" />}
      onPress={onPress}
      // backgroundColor="$gray6"
      size="$4"
      width="$4"
      {...rest}
    />
  );
};
