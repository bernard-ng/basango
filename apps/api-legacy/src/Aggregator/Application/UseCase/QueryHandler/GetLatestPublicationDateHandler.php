<?php

declare(strict_types=1);

namespace Basango\Aggregator\Application\UseCase\QueryHandler;

use Basango\Aggregator\Application\UseCase\Query\GetLatestPublicationDate;
use Basango\SharedKernel\Application\Messaging\QueryHandler;

/**
 * Interface GetLatestPublicationDateHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface GetLatestPublicationDateHandler extends QueryHandler
{
    public function __invoke(GetLatestPublicationDate $query): \DateTimeImmutable;
}
