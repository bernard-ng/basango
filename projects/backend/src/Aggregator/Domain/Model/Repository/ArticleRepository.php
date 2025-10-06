<?php

declare(strict_types=1);

namespace Basango\Aggregator\Domain\Model\Repository;

use Basango\Aggregator\Domain\Model\Entity\Article;
use Basango\Aggregator\Domain\Model\Identity\ArticleId;
use Basango\SharedKernel\Domain\Model\ValueObject\DateRange;

/**
 * Interface ArticleRepository.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface ArticleRepository
{
    public function add(Article $article): void;

    public function remove(Article $article): void;

    public function getById(ArticleId $id): Article;

    public function getByHash(string $hash): ?Article;

    public function export(?string $source, ?DateRange $date): \Generator;

    public function clear(string $source, ?string $category): int;
}
