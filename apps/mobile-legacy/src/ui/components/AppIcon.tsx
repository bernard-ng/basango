import { Image } from "tamagui";

type AppLogoProps = {
  width?: number;
  height?: number;
};

export const AppIcon = (props: AppLogoProps) => {
  const { width = 80, height = 80 } = props;

  return (
    <Image
      height={width}
      marginBottom="$2"
      objectFit="contain"
      source={require("@/assets/images/logo.png")}
      width={height}
    />
  );
};
