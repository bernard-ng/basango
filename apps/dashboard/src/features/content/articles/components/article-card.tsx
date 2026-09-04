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
import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon, Link2Icon, MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";

import { formatDate, formatRelativeTime } from "#dashboard/app/utils/formatters";

type Article = RouterOutputs["articles"]["list"]["items"][number];

type ArticleCardProps = {
  article: Article;
};

export function ArticleCard({ article }: ArticleCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(article.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden border border-border/80 p-0">
      <CardHeader className="relative h-40 overflow-hidden p-0">
        <div className="relative h-full w-full bg-muted">
          <Link
            aria-label={`View details for ${article.title}`}
            className="group block h-full w-full"
            params={{ id: article.id }}
            to="/articles/$id"
          >
            {article.image ? (
              <img
                alt={article.title}
                className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                loading="lazy"
                src={article.image}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                No image available
              </div>
            )}
          </Link>
          <div className="absolute left-3 top-3">
            <Badge variant="secondary">{article.source?.name}</Badge>
          </div>
          <div className="absolute right-3 top-3">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    className="size-8 rounded-full bg-background/80 backdrop-blur"
                    size="icon"
                    variant="ghost"
                  />
                }
              >
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Article actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  render={
                    <a
                      aria-label={`Open original article: ${article.title}`}
                      href={article.link}
                      rel="noreferrer"
                      target="_blank"
                    />
                  }
                >
                  <ExternalLinkIcon className="mr-2 h-4 w-4" />
                  Open original
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Link2Icon className="mr-2 h-4 w-4" />
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
            params={{ id: article.id }}
            to="/articles/$id"
          >
            {article.title}
          </Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {("metadata" in article ? article.metadata?.description : undefined) ??
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
        <div className="flex flex-col items-end gap-1">
          <span>{article.readingTime} min</span>
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            params={{ id: article.id }}
            to="/articles/$id"
          >
            View details
          </Link>
        </div>
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
