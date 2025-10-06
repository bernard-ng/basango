<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\ReadModel;

/**
 * Class CategoryShare.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class CategoryShare
{
    public function __construct(
        public string $category,
        public int $count,
        public float $percentage
    ) {
    }
}
