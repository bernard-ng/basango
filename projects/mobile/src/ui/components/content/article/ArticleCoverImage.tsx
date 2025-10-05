import { GetProps, Image, styled } from "tamagui";

const StyledImage = styled(Image, {
    borderRadius: "$4",
    backgroundColor: "$gray3",
    objectFit: "cover",
});

type ArticleCoverImageProps = GetProps<typeof StyledImage> & {
    uri: string;
    width: string | number;
    height: number;
};

export const ArticleCoverImage = (props: ArticleCoverImageProps) => {
    const { width, height, uri, ...rest } = props;

    return <StyledImage source={{ uri, cache: "force-cache" }} width={width} height={height} {...rest} />;
};
