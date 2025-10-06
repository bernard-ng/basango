<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\QueryHandler;

use Basango\FeedManagement\Application\ReadModel\ArticleOverviewList;
use Basango\FeedManagement\Application\UseCase\Query\GetArticleOverviewList;
use Basango\SharedKernel\Application\Messaging\QueryHandler;

/**
 * Class GetArticleOverviewListHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface GetArticleOverviewListHandler extends QueryHandler
{
    public function __invoke(GetArticleOverviewList $query): ArticleOverviewList;
}
