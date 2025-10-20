<?php

declare(strict_types=1);

namespace Basango\SharedKernel\Infrastructure\Persistence\Doctrine\DBAL\Features;

use Basango\SharedKernel\Domain\Model\Pagination\Page;
use Basango\SharedKernel\Domain\Model\Pagination\PaginationCursor;
use Basango\SharedKernel\Domain\Model\Pagination\PaginationInfo;
use Basango\SharedKernel\Domain\Model\Pagination\PaginatorKeyset;
use Basango\SharedKernel\Domain\Model\ValueObject\SortDirection;
use Doctrine\DBAL\Query\QueryBuilder;

/**
 * Provides methods for generating and applying pagination to datasets and query builders.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
trait PaginationQuery
{
    public function createPaginationInfo(array &$data, Page $page, PaginatorKeyset $keyset): PaginationInfo
    {
        $paginationInfo = PaginationInfo::from($page);
        if ($data === []) {
            return $paginationInfo;
        }

        $hasNext = count($data) > $page->limit;
        if ($hasNext) {
            array_pop($data);
        }

        $cursorSource = end($data);

        if (is_array($cursorSource)) {
            $paginationInfo->cursor = PaginationCursor::encode($cursorSource, $keyset);
        }

        $paginationInfo->hasNext = $hasNext;
        reset($data);

        return $paginationInfo;
    }

    public function applyCursorPagination(
        QueryBuilder $qb,
        Page $page,
        PaginatorKeyset $keyset,
        SortDirection $direction = SortDirection::DESC
    ): QueryBuilder {
        $orderDirection = strtoupper($direction->value);
        $comparisonOperator = $direction === SortDirection::ASC ? '>' : '<';

        if ($keyset->date !== null) {
            $qb->addOrderBy($keyset->date, $orderDirection);
        }

        $qb->addOrderBy($keyset->id, $orderDirection);

        $cursor = PaginationCursor::decode($page->cursor);
        if (! $cursor instanceof PaginationCursor) {
            return $qb->setMaxResults($page->limit + 1);
        }

        if ($keyset->date === null) {
            $qb
                ->andWhere(sprintf('%s %s :cursorLastId', $keyset->id, $comparisonOperator))
                ->setParameter('cursorLastId', $cursor->id->toString());
        } else {
            if (! $cursor->date instanceof \DateTimeImmutable) {
                return $qb->setMaxResults($page->limit + 1);
            }

            $qb
                ->andWhere(sprintf('(%s, %s) %s (:cursorLastDate, :cursorLastId)', $keyset->date, $keyset->id, $comparisonOperator))
                ->setParameter('cursorLastDate', $cursor->date->format('Y-m-d H:i:s'))
                ->setParameter('cursorLastId', $cursor->id->toString());
        }

        return $qb->setMaxResults($page->limit + 1);
    }

    public function applyOffsetPagination(QueryBuilder $qb, Page $page): QueryBuilder
    {
        return $qb
            ->setFirstResult($page->offset)
            ->setMaxResults($page->limit)
        ;
    }
}
