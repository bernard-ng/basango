<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\QueryHandler;

use Basango\FeedManagement\Application\ReadModel\ArticleOverviewList;
use Basango\FeedManagement\Application\UseCase\Query\GetBookmarkedArticleList;
use Basango\SharedKernel\Application\Messaging\QueryHandler;

/**
 * Interface GetBookmarkedArticleListHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface GetBookmarkedArticleListHandler extends QueryHandler
{
    public function __invoke(GetBookmarkedArticleList $query): ArticleOverviewList;
}
