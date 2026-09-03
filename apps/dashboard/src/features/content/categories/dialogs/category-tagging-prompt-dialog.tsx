"use client";

import { Button } from "@basango/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@basango/ui/components/dialog";
import { Textarea } from "@basango/ui/components/textarea";
import { CopyIcon, WandSparklesIcon } from "lucide-react";
import { toast } from "sonner";

import {
  type CategoryTaggingPromptCategory,
  type UnmatchedSourceLabel,
  buildCategoryTaggingPrompt,
} from "../category-tagging-prompt";

type CategoryTaggingPromptDialogProps = {
  categories: readonly CategoryTaggingPromptCategory[];
  unmatchedLabels: readonly UnmatchedSourceLabel[];
};

export function CategoryTaggingPromptDialog({
  categories,
  unmatchedLabels,
}: CategoryTaggingPromptDialogProps) {
  const prompt = buildCategoryTaggingPrompt({ categories, unmatchedLabels });
  const isDisabled = categories.length === 0 || unmatchedLabels.length === 0;

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("SQL generation prompt copied.");
    } catch {
      toast.error("Unable to copy the prompt.");
    }
  }

  return (
    <Dialog>
      <DialogTrigger
        disabled={isDisabled}
        render={<Button size="sm" type="button" variant="outline" />}
      >
        <WandSparklesIcon />
        Generate SQL prompt
      </DialogTrigger>
      <DialogContent className="grid max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Tag unmatched source labels</DialogTitle>
          <DialogDescription>
            Copy this complete prompt into an LLM to generate an idempotent SQL script. Review the
            assignments before running the SQL, then rerun the category clustering worker.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          aria-label="Generated category tagging prompt"
          className="h-[60svh] min-h-80 resize-none overflow-auto font-mono text-xs leading-relaxed"
          readOnly
          value={prompt}
        />

        <DialogFooter>
          <Button onClick={copyPrompt} type="button">
            <CopyIcon />
            Copy prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
