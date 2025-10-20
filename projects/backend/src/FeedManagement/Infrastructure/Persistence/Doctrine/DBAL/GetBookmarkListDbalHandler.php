<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Infrastructure\Persistence\Doctrine\DBAL;

use Basango\FeedManagement\Application\ReadModel\BookmarkList;
use Basango\FeedManagement\Application\UseCase\Query\GetBookmarkList;
use Basango\FeedManagement\Application\UseCase\QueryHandler\GetBookmarkListHandler;
use Basango\FeedManagement\Infrastructure\Persistence\Doctrine\DBAL\Queries\BookmarkQuery;
use Basango\SharedKernel\Domain\Model\Pagination\PaginatorKeyset;
use Basango\SharedKernel\Infrastructure\Persistence\Doctrine\DBAL\Features\PaginationQuery;
use Basango\SharedKernel\Infrastructure\Persistence\Doctrine\DBAL\NoResult;
use Doctrine\DBAL\Connection;

/**
 * Class GetBookmarkListDbalHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class GetBookmarkListDbalHandler implements GetBookmarkListHandler
{
    use PaginationQuery;
    use BookmarkQuery;

    public function __construct(
        private Connection $connection,
    ) {
    }

    public function __invoke(GetBookmarkList $query): BookmarkList
    {
        $qb = $this->connection->createQueryBuilder();
        $qb = $this->addBookmarkSelectQuery($qb);

        $qb->from('bookmark', 'b')
            ->leftJoin('b', 'bookmark_article', 'ba', 'ba.bookmark_id = b.id')
            ->where('b.user_id = :userId')
            ->groupBy('b.id')
            ->setParameter('userId', $query->userId->toString())
        ;

        $qb = $this->applyCursorPagination($qb, $query->page, new PaginatorKeyset('b.id'));

        try {
            $data = $qb->executeQuery()->fetchAllAssociative();
        } catch (\Throwable $e) {
            throw NoResult::forQuery($qb->getSQL(), $qb->getParameters(), $e);
        }

        $pagination = $this->createPaginationInfo($data, $query->page, new PaginatorKeyset('bookmark_id'));
        return BookmarkList::create($data, $pagination);
    }
}
