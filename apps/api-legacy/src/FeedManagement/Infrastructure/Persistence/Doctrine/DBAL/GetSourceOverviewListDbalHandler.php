<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Infrastructure\Persistence\Doctrine\DBAL;

use Basango\FeedManagement\Application\ReadModel\SourceOverviewList;
use Basango\FeedManagement\Application\UseCase\Query\GetSourceOverviewList;
use Basango\FeedManagement\Application\UseCase\QueryHandler\GetSourceOverviewListHandler;
use Basango\FeedManagement\Infrastructure\Persistence\Doctrine\DBAL\Queries\SourceQuery;
use Basango\SharedKernel\Domain\Model\Pagination\PaginatorKeyset;
use Basango\SharedKernel\Infrastructure\Persistence\Doctrine\DBAL\Features\PaginationQuery;
use Basango\SharedKernel\Infrastructure\Persistence\Doctrine\DBAL\NoResult;
use Doctrine\DBAL\Connection;

/**
 * Class GetSourceOverviewListDbalHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class GetSourceOverviewListDbalHandler implements GetSourceOverviewListHandler
{
    use PaginationQuery;
    use SourceQuery;

    public function __construct(
        private Connection $connection,
    ) {
    }

    #[\Override]
    public function __invoke(GetSourceOverviewList $query): SourceOverviewList
    {
        $qb = $this->connection->createQueryBuilder();
        $qb = $this->addSourceOverviewSelectQuery($qb);
        $qb = $this->addFollowedSourceExistsQuery($qb);

        $qb->from('source', 's')
            ->setParameter('userId', $query->userId->toString())
        ;

        $qb = $this->applyCursorPagination($qb, $query->page, new PaginatorKeyset('s.id', 's.created_at'));

        try {
            $data = $qb->executeQuery()->fetchAllAssociative();
        } catch (\Throwable $e) {
            throw NoResult::forQuery($qb->getSQL(), $qb->getParameters(), $e);
        }

        $pagination = $this->createPaginationInfo($data, $query->page, new PaginatorKeyset('source_id', 'source_created_at'));
        return SourceOverviewList::create($data, $pagination);
    }
}
