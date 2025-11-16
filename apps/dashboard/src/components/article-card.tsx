"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { Badge } from "@basango/ui/components/badge";
import { Button } from "@basango/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@basango/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@basango/ui/components/dropdown-menu";
import { Skeleton } from "@basango/ui/components/skeleton";
import { ExternalLink, Link2, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { formatDate, formatRelativeTime } from "#dashboard/utils/utils";

type Article = RouterOutputs["articles"]["list"]["items"][number];

type ArticleCardProps = {
  article: Article;
};

export function ArticleCard({ article }: ArticleCardProps) {
  const [copied, setCopied] = React.useState(false);

  const copyLink = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(article.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [article.link]);

  return (
    <Card className="flex h-full flex-col overflow-hidden border border-border/80 p-0">
      <CardHeader className="relative h-40 overflow-hidden p-0">
        <div className="relative h-full w-full bg-muted">
          {article.image ? (
            <img
              alt={article.title}
              className="h-full w-full object-cover transition duration-200 hover:scale-105"
              loading="lazy"
              src={article.image}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No image available
            </div>
          )}
          <div className="absolute left-3 top-3">
            <Badge variant="secondary">{article.source?.name}</Badge>
          </div>
          <div className="absolute right-3 top-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="size-8 rounded-full bg-background/80 backdrop-blur"
                  size="icon"
                  variant="ghost"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={article.link} rel="noreferrer" target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open original
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyLink}>
                  <Link2 className="mr-2 h-4 w-4" />
                  {copied ? "Copied!" : "Copy link"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <CardTitle className="text-base leading-tight">
          <Link
            className="transition hover:text-primary hover:underline"
            href={article.link}
            rel="noreferrer"
            target="_blank"
          >
            {article.title}
          </Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {article.metadata?.description ??
            article.excerpt ??
            "No description was provided for this article."}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {formatDate(article.publishedAt.toISOString(), "PP", false)}
          </span>
          <span>{formatRelativeTime(article.publishedAt)}</span>
        </div>
        <span>{article.readingTime} min</span>
      </CardFooter>
    </Card>
  );
}

export function ArticleCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="h-60 w-full bg-muted">
        <Skeleton className="h-full w-full" />
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
      <CardFooter className="flex items-center justify-between px-4 py-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-16" />
      </CardFooter>
    </Card>
  );
}
