import { PageLayout } from "#dashboard/app/components/page-layout";

import { ArticlesFeed } from "../components/articles-feed";
import { CategoriesCarousel } from "../components/categories-carousel";

export function ArticlesPage() {
  return (
    <PageLayout
      description="Browse collected articles and narrow the feed by category."
      title="Articles"
      toolbar={<CategoriesCarousel />}
    >
      <ArticlesFeed />
    </PageLayout>
  );
}
