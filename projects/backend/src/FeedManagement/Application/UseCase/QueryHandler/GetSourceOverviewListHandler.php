<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\QueryHandler;

use Basango\FeedManagement\Application\ReadModel\SourceOverviewList;
use Basango\FeedManagement\Application\UseCase\Query\GetSourceOverviewList;
use Basango\SharedKernel\Application\Messaging\QueryHandler;

/**
 * Interface GetSourceOverviewListHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface GetSourceOverviewListHandler extends QueryHandler
{
    public function __invoke(GetSourceOverviewList $query): SourceOverviewList;
}
