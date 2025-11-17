"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@basango/ui/components/card";
import Link from "next/link";
import type { ReactNode } from "react";

import { RouterOutputs } from "#api/trpc/routers/_app";
import { SourceEditForm } from "#dashboard/components/forms/source-edit-form";

type Props = {
  source: RouterOutputs["sources"]["getById"];
};

export function SourceDetailsTab({ source }: Props) {
  const credibility = source.credibility;

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Source details</CardTitle>
          <CardDescription>Key properties of this publication.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-6 sm:grid-cols-2">
            <DetailItem label="Name" value={source.name} />
            <DetailItem label="Display name" value={source.displayName ?? "—"} />
            <DetailItem
              label="Website"
              value={
                <Link
                  className="text-primary underline underline-offset-4"
                  href={source.url}
                  target="_blank"
                >
                  {source.url}
                </Link>
              }
            />
            <DetailItem label="Description" value={source.description ?? "Not provided"} />
            <DetailItem label="Bias" value={credibility?.bias ?? "Unknown"} />
            <DetailItem label="Reliability" value={credibility?.reliability ?? "Unknown"} />
            <DetailItem label="Transparency" value={credibility?.transparency ?? "Unknown"} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit source</CardTitle>
          <CardDescription>
            Update the name or description shown inside the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SourceEditForm source={source} />
        </CardContent>
      </Card>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-base font-medium wrap-break-word">{value}</dd>
    </div>
  );
}
