<?php

declare(strict_types=1);

namespace Basango\Aggregator\Application\UseCase\QueryHandler;

use Basango\Aggregator\Application\UseCase\Query\GetEarliestPublicationDate;
use Basango\SharedKernel\Application\Messaging\QueryHandler;

/**
 * Interface GetEarliestPublicationDateHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface GetEarliestPublicationDateHandler extends QueryHandler
{
    public function __invoke(GetEarliestPublicationDate $query): \DateTimeImmutable;
}
