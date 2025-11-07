<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\ReadModel;

use Basango\SharedKernel\Domain\Assert;
use Basango\SharedKernel\Domain\Model\Pagination\PaginationInfo;

/**
 * Class SourceOverviewList.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class SourceOverviewList
{
    public function __construct(
        public array $items,
        public PaginationInfo $pagination,
    ) {
        Assert::allIsInstanceOf($items, SourceOverview::class);
    }

    public static function create(array $items, PaginationInfo $pagination): self
    {
        return new self(
            array_map(fn (array $item): SourceOverview => SourceOverview::create($item), $items),
            $pagination
        );
    }
}
