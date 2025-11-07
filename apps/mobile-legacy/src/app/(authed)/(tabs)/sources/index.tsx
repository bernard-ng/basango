import { useSourceOverviewList } from "@/api/request/feed-management/source";
import { SourceOverview } from "@/api/schema/feed-management/source";
import { useFlattenedItems } from "@/hooks/use-flattened-items";
import { SourceList, SourceSkeletonList } from "@/ui/components/content/source";
import { ScreenView } from "@/ui/components/layout";

export default function Sources() {
    const { data, isLoading } = useSourceOverviewList();
    const sources: SourceOverview[] = useFlattenedItems(data);

    return (
        <ScreenView>
            <ScreenView.Heading title="Sources" />

            {isLoading && <SourceSkeletonList horizontal={false} />}
            {!isLoading && <SourceList data={sources} horizontal={false} />}
        </ScreenView>
    );
}
