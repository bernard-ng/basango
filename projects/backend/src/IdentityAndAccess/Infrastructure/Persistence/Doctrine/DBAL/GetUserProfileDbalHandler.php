<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Infrastructure\Persistence\Doctrine\DBAL;

use Basango\IdentityAndAccess\Application\ReadModel\UserProfile;
use Basango\IdentityAndAccess\Application\UseCase\Query\GetUserProfile;
use Basango\IdentityAndAccess\Application\UseCase\QueryHandler\GetUserProfileHandler;
use Basango\IdentityAndAccess\Domain\Exception\UserNotFound;
use Doctrine\DBAL\Connection;

/**
 * Class GetUserProfileDbalHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class GetUserProfileDbalHandler implements GetUserProfileHandler
{
    public function __construct(
        private Connection $connection
    ) {
    }

    public function __invoke(GetUserProfile $query): UserProfile
    {
        $qb = $this->connection->createQueryBuilder()
            ->select(
                'u.id as user_id',
                'u.name as user_name',
                'u.email as user_email',
                'u.created_at as user_created_at',
                'u.updated_at as user_updated_at'
            )
            ->from('user', 'u')
            ->where('u.id = :userId')
            ->setParameter('userId', $query->userId->toRfc4122());

        /** @var array<string, mixed>|false $data */
        $data = $qb->executeQuery()->fetchAssociative();

        if ($data === false) {
            throw UserNotFound::withId($query->userId);
        }

        return UserProfile::create($data);
    }
}
