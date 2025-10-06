<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\QueryHandler;

use Basango\FeedManagement\Application\ReadModel\SourceDetails;
use Basango\FeedManagement\Application\UseCase\Query\GetSourceDetails;
use Basango\SharedKernel\Application\Messaging\QueryHandler;

/**
 * Interface GetSourceDetailsHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface GetSourceDetailsHandler extends QueryHandler
{
    public function __invoke(GetSourceDetails $query): SourceDetails;
}
