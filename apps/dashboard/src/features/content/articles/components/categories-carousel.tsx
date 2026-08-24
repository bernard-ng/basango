"use client";

import { Carousel, CarouselContent, CarouselItem } from "@basango/ui/components/carousel";
import { Skeleton } from "@basango/ui/components/skeleton";
import { cn } from "@basango/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { Show } from "#dashboard/app/components/show";
import { useTRPC } from "#dashboard/app/trpc/client";

import { useCategoryFilterParams } from "../hooks/use-category-filter-params";

export function CategoriesCarousel() {
  const { selectedCategory, setSelectedCategory } = useCategoryFilterParams();
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.categories.list.queryOptions());
  const categories = data ?? [];

  return (
    <div className="relative flex w-full items-start rounded-lg border bg-card p-2">
      <Carousel
        className="w-full"
        opts={{
          align: "start",
          containScroll: "trimSnaps",
          dragFree: true,
        }}
      >
        <CarouselContent className="-ml-2">
          <CarouselItem className="basis-auto pl-2">
            <CategoryPill active={!selectedCategory} onClick={() => setSelectedCategory(null)}>
              All
            </CategoryPill>
          </CarouselItem>
          <Show
            fallback={Array.from({ length: 10 }).map((_, index) => (
              <CarouselItem className="basis-auto pl-2" key={`category-skeleton-${index}`}>
                <Skeleton className="h-8 w-20 rounded-full bg-muted/70" />
              </CarouselItem>
            ))}
            when={!isLoading && data}
          >
            {categories.map((category) => (
              <CarouselItem className="basis-auto pl-2" key={category.id}>
                <CategoryPill
                  active={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </CategoryPill>
              </CarouselItem>
            ))}
          </Show>
        </CarouselContent>
      </Carousel>
    </div>
  );
}

type CategoryPillProps = {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
};

function CategoryPill({ active, children, onClick }: CategoryPillProps) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-foreground bg-foreground text-background shadow-sm"
          : "border-border bg-muted/60 text-foreground hover:border-foreground/60",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
