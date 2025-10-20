<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Infrastructure\Persistence\Doctrine\ORM;

use Basango\Aggregator\Domain\Model\Identity\SourceId;
use Basango\FeedManagement\Domain\Model\Entity\FollowedSource;
use Basango\FeedManagement\Domain\Model\Repository\FollowedSourceRepository;
use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Class FollowedSourceOrmRepository.
 *
 * @extends ServiceEntityRepository<FollowedSource>
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class FollowedSourceOrmRepository extends ServiceEntityRepository implements FollowedSourceRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, FollowedSource::class);
    }

    public function add(FollowedSource $followedSource): void
    {
        $this->getEntityManager()->persist($followedSource);
        $this->getEntityManager()->flush();
    }

    public function remove(FollowedSource $followedSource): void
    {
        $this->getEntityManager()->remove($followedSource);
        $this->getEntityManager()->flush();
    }

    public function getByUserId(UserId $userId, SourceId $sourceId): ?FollowedSource
    {
        return $this->createQueryBuilder('fs')
            ->andWhere('IDENTITY(fs.follower) = :userId')
            ->andWhere('IDENTITY(fs.source) = :sourceId')
            ->setParameter('sourceId', $sourceId->toString())
            ->setParameter('userId', $userId->toString())
            ->getQuery()
            ->getOneOrNullResult();
    }
}
