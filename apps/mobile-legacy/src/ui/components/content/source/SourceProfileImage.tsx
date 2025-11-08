import { GetProps, Image, styled } from "tamagui";

const StyledImage = styled(Image, {
  backgroundColor: "white",
  borderRadius: "$12",
});

type SourceAvatarProps = GetProps<typeof StyledImage> & {
  image: string;
  name: string;
  size?: number;
};

export const SourceProfileImage = (props: SourceAvatarProps) => {
  const { image, name, size = 50, ...rest } = props;

  return (
    <StyledImage
      accessibilityLabel={name}
      height={size}
      objectFit="contain"
      source={{
        cache: "force-cache",
        uri: image,
      }}
      width={size}
      {...rest}
    />
  );
};
