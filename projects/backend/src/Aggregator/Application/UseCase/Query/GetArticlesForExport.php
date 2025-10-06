<?php

declare(strict_types=1);

namespace Basango\Aggregator\Application\UseCase\Query;

use Basango\SharedKernel\Domain\Model\ValueObject\DateRange;

/**
 * Class GetArticlesForExport.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class GetArticlesForExport
{
    public function __construct(
        public ?string $source = null,
        public ?DateRange $date = null
    ) {
    }
}
