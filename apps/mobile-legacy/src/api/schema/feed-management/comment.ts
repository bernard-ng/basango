export type Comment = {
    id: string;
    content: string;
    user: {
        id: string;
        name: string;
    };
    sentiment: "positive" | "neutral" | "negative";
    createdAt: string;
};

export type CommentPayload = {
    content: string;
};
