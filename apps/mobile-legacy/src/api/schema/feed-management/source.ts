export type SourceReference = {
    id: string;
    name: string;
    displayName?: string;
    image: string;
    url: string;
};

export type SourceOverview = {
    id: string;
    name: string;
    displayName?: string;
    image: string;
    url: string;
    followed: boolean;
};

export type CategoryShare = {
    name: string;
    count: number;
    percentage: number;
};

export type PublicationEntry = {
    date: string;
    count: number;
};

export type SourceDetails = {
    id: string;
    name: string;
    url: string;
    credibility: {
        bias: "neutral" | "slightly" | "partisan" | "extreme";
        reliability: "trusted" | "reliable" | "average" | "unreliable" | "low_trust";
        transparency: "low" | "medium" | "high";
    };
    publicationGraph: {
        items: PublicationEntry[];
        total: number;
    };
    categoryShares: {
        items: CategoryShare[];
        total: number;
    };
    articlesCount: number;
    crawledAt: string;
    displayName?: string;
    description?: string;
    updatedAt?: string;
    metadataAvailable: number;
    followed: boolean;
    image: string;
};
