<?php

declare(strict_types=1);

namespace Basango\Aggregator\Application\UseCase\QueryHandler;

use Basango\Aggregator\Application\ReadModel\SourceStatisticsList;
use Basango\Aggregator\Application\UseCase\Query\GetSourceStatisticsList;
use Basango\SharedKernel\Application\Messaging\QueryHandler;

/**
 * Interface GetSourceStatisticsListHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface GetSourceStatisticsListHandler extends QueryHandler
{
    public function __invoke(GetSourceStatisticsList $query): SourceStatisticsList;
}
