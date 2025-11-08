import { GetProps, Image, styled } from "tamagui";

const StyledImage = styled(Image, {
  backgroundColor: "$gray3",
  borderRadius: "$4",
  objectFit: "cover",
});

type ArticleCoverImageProps = GetProps<typeof StyledImage> & {
  uri: string;
  width: string | number;
  height: number;
};

export const ArticleCoverImage = (props: ArticleCoverImageProps) => {
  const { width, height, uri, ...rest } = props;

  return (
    <StyledImage height={height} source={{ cache: "force-cache", uri }} width={width} {...rest} />
  );
};
