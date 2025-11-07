<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\QueryHandler;

use Basango\FeedManagement\Application\ReadModel\ArticleOverviewList;
use Basango\FeedManagement\Application\UseCase\Query\GetSourceArticleOverviewList;
use Basango\SharedKernel\Application\Messaging\QueryHandler;

/**
 * Class GetArticleOverviewListHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface GetSourceArticleOverviewListHandler extends QueryHandler
{
    public function __invoke(GetSourceArticleOverviewList $query): ArticleOverviewList;
}
