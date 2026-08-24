import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { Badge } from "@basango/ui/components/badge";
import { buttonVariants } from "@basango/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@basango/ui/components/card";
import { cn } from "@basango/ui/lib/utils";
import { Markdown, type MarkdownComponents } from "@tanstack/markdown/react";
import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon } from "lucide-react";

import { Detail, DetailsSection } from "#dashboard/app/components/detail-list";
import { DetailsPageHeader } from "#dashboard/app/components/details-page-header";
import { formatDate, formatNumber } from "#dashboard/app/utils/formatters";

type Article = RouterOutputs["articles"]["getById"];

type ArticleDetailsProps = {
  article: Article;
};

const markdownComponents = {
  a({ className, href, ...props }) {
    const isExternal = href?.startsWith("http://") || href?.startsWith("https://");

    return (
      <a
        {...props}
        className={cn("font-medium text-primary underline underline-offset-4", className)}
        href={href}
        rel={isExternal ? "nofollow noopener noreferrer" : props.rel}
        target={isExternal ? "_blank" : props.target}
      />
    );
  },
  blockquote({ className, ...props }) {
    return (
      <blockquote
        className={cn("border-l-4 border-border pl-4 italic text-muted-foreground", className)}
        {...props}
      />
    );
  },
  code({ className, ...props }) {
    return (
      <code
        className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-sm", className)}
        {...props}
      />
    );
  },
  h1({ className, ...props }) {
    return <h1 className={cn("text-2xl font-semibold tracking-tight", className)} {...props} />;
  },
  h2({ className, ...props }) {
    return <h2 className={cn("text-xl font-semibold tracking-tight", className)} {...props} />;
  },
  h3({ className, ...props }) {
    return <h3 className={cn("text-lg font-semibold", className)} {...props} />;
  },
  img({ alt, className, ...props }) {
    return (
      <img
        {...props}
        alt={alt ?? ""}
        className={cn("rounded-lg border", className)}
        loading="lazy"
      />
    );
  },
  ol({ className, ...props }) {
    return <ol className={cn("ml-6 list-decimal space-y-1", className)} {...props} />;
  },
  p({ className, ...props }) {
    return <p className={cn("leading-7", className)} {...props} />;
  },
  pre({ className, ...props }) {
    return <pre className={cn("overflow-x-auto rounded-lg bg-muted p-4", className)} {...props} />;
  },
  table({ className, ...props }) {
    return (
      <div className="overflow-x-auto">
        <table className={cn("w-full border-collapse text-sm", className)} {...props} />
      </div>
    );
  },
  td({ className, ...props }) {
    return <td className={cn("border px-3 py-2 align-top", className)} {...props} />;
  },
  th({ className, ...props }) {
    return <th className={cn("border bg-muted px-3 py-2 text-left", className)} {...props} />;
  },
  ul({ className, ...props }) {
    return <ul className={cn("ml-6 list-disc space-y-1", className)} {...props} />;
  },
} satisfies MarkdownComponents;

export function ArticleDetails({ article }: ArticleDetailsProps) {
  const description = article.metadata?.description ?? article.excerpt;

  return (
    <div className="space-y-4">
      <DetailsPageHeader
        actions={
          <a
            className={buttonVariants({ variant: "outline" })}
            href={article.link}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLinkIcon data-icon="inline-start" />
            Open original
          </a>
        }
        description={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={sentimentBadgeVariant(article.sentiment)}>{article.sentiment}</Badge>
            {article.category ? <Badge variant="outline">{article.category.name}</Badge> : null}
          </div>
        }
        eyebrow="Article"
        identifier={article.id}
        title={article.title}
      />

      {article.image ? (
        <Card className="overflow-hidden py-0">
          <img
            alt={article.title}
            className="max-h-[30rem] w-full object-cover"
            src={article.image}
          />
        </Card>
      ) : null}

      <Card>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <DetailsSection title="Publication">
            <Detail label="Source">
              <Link
                className="font-medium text-foreground underline-offset-4 hover:underline"
                params={{ id: article.source.id }}
                to="/sources/$id"
              >
                {article.source.displayName ?? article.source.name}
              </Link>
            </Detail>
            <Detail label="Category">{article.category?.name ?? "—"}</Detail>
            <Detail label="Published">{formatDateTime(article.publishedAt)}</Detail>
            <Detail label="Crawled">{formatDateTime(article.crawledAt)}</Detail>
            <Detail label="Updated">{formatDateTime(article.updatedAt)}</Detail>
            <Detail label="Reading time">{article.readingTime ?? 0} min</Detail>
          </DetailsSection>

          <DetailsSection title="Provenance">
            <Detail label="Author">{article.metadata?.author ?? "—"}</Detail>
            <Detail label="Source URL">
              <a
                className="text-foreground underline-offset-4 hover:underline"
                href={article.link}
                rel="noreferrer"
                target="_blank"
              >
                {article.link}
              </a>
            </Detail>
            <Detail label="Hash">
              <span className="font-mono text-xs">{article.hash}</span>
            </Detail>
            <Detail label="Clustered">{article.clustered ? "Yes" : "No"}</Detail>
            <Detail label="Source categories">
              <CategoryBadges categories={article.categories ?? []} />
            </Detail>
          </DetailsSection>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Article content</CardTitle>
          <CardDescription>{description ?? "No summary was provided."}</CardDescription>
        </CardHeader>
        <CardContent>
          <article className="grid gap-4 text-sm text-foreground">
            <Markdown components={markdownComponents}>{article.body}</Markdown>
          </article>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <DetailsSection title="Extracted metadata">
            <Detail label="Title">{article.metadata?.title ?? "—"}</Detail>
            <Detail label="Description">{article.metadata?.description ?? "—"}</Detail>
            <Detail label="Published value">{article.metadata?.publishedAt ?? "—"}</Detail>
            <Detail label="Updated value">{article.metadata?.updatedAt ?? "—"}</Detail>
          </DetailsSection>

          <DetailsSection title="Token statistics">
            <Detail label="Total">{formatNumber(article.tokenStatistics?.total)}</Detail>
            <Detail label="Title">{formatNumber(article.tokenStatistics?.title)}</Detail>
            <Detail label="Body">{formatNumber(article.tokenStatistics?.body)}</Detail>
            <Detail label="Excerpt">{formatNumber(article.tokenStatistics?.excerpt)}</Detail>
            <Detail label="Categories">{formatNumber(article.tokenStatistics?.categories)}</Detail>
          </DetailsSection>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryBadges({ categories }: { categories: string[] }) {
  if (categories.length === 0) {
    return "—";
  }

  return (
    <span className="flex flex-wrap gap-1">
      {categories.map((category) => (
        <Badge key={category} variant="secondary">
          {category}
        </Badge>
      ))}
    </span>
  );
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "—";
  }

  return formatDate(value.toISOString(), "PPp", false);
}

function sentimentBadgeVariant(sentiment: Article["sentiment"]) {
  if (sentiment === "negative") {
    return "destructive" as const;
  }

  if (sentiment === "positive") {
    return "default" as const;
  }

  return "secondary" as const;
}
