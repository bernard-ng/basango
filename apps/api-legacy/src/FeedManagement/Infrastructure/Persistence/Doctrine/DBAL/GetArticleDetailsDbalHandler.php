<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Infrastructure\Persistence\Doctrine\DBAL;

use Basango\Aggregator\Domain\Exception\ArticleNotFound;
use Basango\FeedManagement\Application\ReadModel\ArticleDetails;
use Basango\FeedManagement\Application\UseCase\Query\GetArticleDetails;
use Basango\FeedManagement\Application\UseCase\QueryHandler\GetArticleDetailsHandler;
use Basango\FeedManagement\Infrastructure\Persistence\Doctrine\DBAL\Queries\ArticleQuery;
use Basango\FeedManagement\Infrastructure\Persistence\Doctrine\DBAL\Queries\BookmarkQuery;
use Basango\FeedManagement\Infrastructure\Persistence\Doctrine\DBAL\Queries\SourceQuery;
use Basango\SharedKernel\Infrastructure\Persistence\Doctrine\DBAL\NoResult;
use Doctrine\DBAL\Connection;

/**
 * Class GetArticleDetailsDbalHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class GetArticleDetailsDbalHandler implements GetArticleDetailsHandler
{
    use BookmarkQuery;
    use SourceQuery;
    use ArticleQuery;

    public function __construct(
        private Connection $connection,
    ) {
    }

    #[\Override]
    public function __invoke(GetArticleDetails $query): ArticleDetails
    {
        $qb = $this->connection->createQueryBuilder();
        $qb = $this->addArticleDetailsSelectQuery($qb);
        $qb = $this->addSourceOverviewSelectQuery($qb);
        $qb = $this->addArticleBookmarkedExistsQuery($qb);

        $qb->innerJoin('a', 'source', 's', 'a.source_id = s.id')
            ->from('article', 'a')
            ->where('a.id = :articleId')
            ->setParameter('articleId', $query->id->toString())
            ->setParameter('userId', $query->userId->toString())
        ;

        try {
            /** @var array<string, mixed>|false $data */
            $data = $qb->executeQuery()->fetchAssociative();
        } catch (\Throwable $e) {
            throw NoResult::forQuery($qb->getSQL(), $qb->getParameters(), $e);
        }

        if ($data === false) {
            throw ArticleNotFound::withId($query->id);
        }

        return ArticleDetails::create($data);
    }
}
