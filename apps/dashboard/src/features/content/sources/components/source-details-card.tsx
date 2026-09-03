import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { Badge } from "@basango/ui/components/badge";
import { Card, CardContent } from "@basango/ui/components/card";

import { Detail, DetailsSection } from "#dashboard/app/components/detail-list";
import { formatDate } from "#dashboard/app/utils/formatters";

type SourceDetailsCardProps = {
  source: RouterOutputs["sources"]["getById"];
};

export function SourceDetailsCard({ source }: SourceDetailsCardProps) {
  const credibility = source.credibility;

  return (
    <Card>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <DetailsSection title="Identity">
          <Detail label="Name">{source.name}</Detail>
          <Detail label="Display name">{source.displayName ?? "—"}</Detail>
          <Detail label="Website">
            <a
              className="text-foreground underline-offset-4 hover:underline"
              href={source.url}
              rel="noreferrer"
              target="_blank"
            >
              {source.url}
            </a>
          </Detail>
          <Detail label="Description">{source.description ?? "—"}</Detail>
          <Detail label="Last updated">
            {source.updatedAt ? formatDate(source.updatedAt.toISOString(), "PPp", false) : "—"}
          </Detail>
        </DetailsSection>

        <DetailsSection title="Credibility">
          <Detail label="Bias">
            <CredibilityBadge value={credibility?.bias} />
          </Detail>
          <Detail label="Reliability">
            <CredibilityBadge value={credibility?.reliability} />
          </Detail>
          <Detail label="Transparency">
            <CredibilityBadge value={credibility?.transparency} />
          </Detail>
        </DetailsSection>
      </CardContent>
    </Card>
  );
}

function CredibilityBadge({ value }: { value?: string }) {
  return <Badge variant="outline">{value?.replaceAll("_", " ") ?? "Unknown"}</Badge>;
}
