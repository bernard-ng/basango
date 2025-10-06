<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\ReadModel;

use Basango\SharedKernel\Domain\Assert;
use Basango\SharedKernel\Domain\Model\Pagination\PaginationInfo;

/**
 * Class ArticleOverviewList.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class ArticleOverviewList
{
    public function __construct(
        public array $items,
        public PaginationInfo $pagination
    ) {
        Assert::allIsInstanceOf($this->items, ArticleOverview::class);
    }

    public static function create(array $items, PaginationInfo $pagination): self
    {
        return new self(
            array_map(fn (array $item): ArticleOverview => ArticleOverview::create($item), $items),
            $pagination
        );
    }
}
