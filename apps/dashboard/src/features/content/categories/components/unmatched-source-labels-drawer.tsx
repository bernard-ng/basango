"use client";

import { Badge } from "@basango/ui/components/badge";
import { Button } from "@basango/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@basango/ui/components/drawer";
import { TagsIcon } from "lucide-react";

import { formatNumber } from "#dashboard/app/utils/formatters";

import type {
  CategoryTaggingPromptCategory,
  UnmatchedSourceLabel,
} from "../category-tagging-prompt";
import { CategoryTaggingPromptDialog } from "../dialogs/category-tagging-prompt-dialog";

type UnmatchedSourceLabelsDrawerProps = {
  categories: readonly CategoryTaggingPromptCategory[];
  unmatchedLabels: readonly UnmatchedSourceLabel[];
};

export function UnmatchedSourceLabelsDrawer({
  categories,
  unmatchedLabels,
}: UnmatchedSourceLabelsDrawerProps) {
  return (
    <Drawer swipeDirection="right">
      <DrawerTrigger
        disabled={unmatchedLabels.length === 0}
        render={<Button type="button" variant="outline" />}
      >
        <TagsIcon data-icon="inline-start" />
        Unmatched ({formatNumber(unmatchedLabels.length)})
      </DrawerTrigger>
      <DrawerContent className="data-[swipe-axis=x]:[--drawer-content-width:min(100%,32rem)]">
        <DrawerHeader className="border-b pb-4 pr-12">
          <DrawerTitle>Unmatched source labels</DrawerTitle>
          <DrawerDescription>
            {formatNumber(unmatchedLabels.length)} labels are not covered by any category candidate.
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ul className="divide-y rounded-lg border">
            {unmatchedLabels.map((label) => (
              <li
                className="flex items-center justify-between gap-4 px-3 py-2.5"
                key={label.candidate}
              >
                <span className="min-w-0 break-words text-sm">{label.candidate}</span>
                <Badge className="shrink-0 tabular-nums" variant="secondary">
                  {formatNumber(label.count)}
                </Badge>
              </li>
            ))}
          </ul>
        </div>

        <DrawerFooter className="border-t bg-muted/50 pt-4 sm:flex-row sm:justify-end">
          <DrawerClose render={<Button type="button" variant="outline" />}>Close</DrawerClose>
          <CategoryTaggingPromptDialog categories={categories} unmatchedLabels={unmatchedLabels} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
