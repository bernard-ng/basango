<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\ReadModel;

use Basango\SharedKernel\Domain\Assert;
use Basango\SharedKernel\Domain\Model\Pagination\PaginationInfo;

/**
 * Class CommentList.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class CommentList
{
    public function __construct(
        public array $items,
        public PaginationInfo $pagination
    ) {
        Assert::allIsInstanceOf($this->items, Comment::class);
    }

    public static function create(array $items, PaginationInfo $pagination): self
    {
        return new self(
            array_map(fn (array $item): Comment => Comment::create($item), $items),
            $pagination
        );
    }
}
