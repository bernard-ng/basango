"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@basango/ui/components/carousel";
import { Skeleton } from "@basango/ui/components/skeleton";
import { cn } from "@basango/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { Show } from "#dashboard/components/shell/show";
import { useTRPC } from "#dashboard/trpc/client";

type Props = {
  onSelect: (categoryId: string | null) => void;
  selectedCategory: string | null;
};

const PLACEHOLDER_COUNT = 10;

export function CategoriesCarousel({ onSelect, selectedCategory }: Props) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.categories.list.queryOptions());
  const categories = data ?? [];

  return (
    <div className="relative">
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
            <CategoryPill active={!selectedCategory} onClick={() => onSelect(null)}>
              All
            </CategoryPill>
          </CarouselItem>
          <Show
            fallback={Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
              <CarouselItem className="basis-auto pl-2" key={`category-skeleton-${index}`}>
                <Skeleton className="h-8 w-20 rounded-full bg-muted/70" />
              </CarouselItem>
            ))}
            when={isLoading && categories.length > 0}
          >
            {categories.map((category) => (
              <CarouselItem className="basis-auto pl-2" key={category.id}>
                <CategoryPill
                  active={selectedCategory === category.id}
                  onClick={() => onSelect(category.id)}
                >
                  {category.name}
                </CategoryPill>
              </CarouselItem>
            ))}
          </Show>
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" size="icon" />
        <CarouselNext className="hidden md:flex" size="icon" />
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
