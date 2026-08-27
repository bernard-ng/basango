import { IngestionRunsTable } from "#dashboard/features/ingestion/runs/components/ingestion-runs-table";

type SourceIngestionRunsProps = {
  sourceId: string;
  sourceName: string;
};

export function SourceIngestionRuns({ sourceId, sourceName }: SourceIngestionRunsProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-semibold">Ingestion runs</h2>
        <p className="text-sm text-muted-foreground">
          Crawl history for {sourceName}. This view loads durable run data without realtime updates.
        </p>
      </div>
      <IngestionRunsTable
        realtime={false}
        sourceId={sourceName}
        tableId={`source.${sourceId}.ingestion-runs`}
      />
    </section>
  );
}
