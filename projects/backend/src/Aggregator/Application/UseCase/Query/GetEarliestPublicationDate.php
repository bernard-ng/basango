<?php

declare(strict_types=1);

namespace Basango\Aggregator\Application\UseCase\Query;

/**
 * Class GetEarliestPublicationDate.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class GetEarliestPublicationDate
{
    public function __construct(
        public string $source,
        public ?string $category = null
    ) {
    }
}
