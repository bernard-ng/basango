<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Infrastructure\Persistence\Doctrine\ORM;

use Basango\IdentityAndAccess\Domain\Model\Entity\LoginAttempt;
use Basango\IdentityAndAccess\Domain\Model\Entity\User;
use Basango\IdentityAndAccess\Domain\Model\Repository\LoginAttemptRepository;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Class LoginAttemptOrmRepository.
 *
 * @extends ServiceEntityRepository<LoginAttempt>
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class LoginAttemptOrmRepository extends ServiceEntityRepository implements LoginAttemptRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LoginAttempt::class);
    }

    #[\Override]
    public function add(LoginAttempt $loginAttempt): void
    {
        $this->getEntityManager()->persist($loginAttempt);
        $this->getEntityManager()->flush();
    }

    #[\Override]
    public function remove(LoginAttempt $loginAttempt): void
    {
        $this->getEntityManager()->remove($loginAttempt);
        $this->getEntityManager()->flush();
    }

    #[\Override]
    public function countBy(User $user): int
    {
        return $this->count([
            'user' => $user,
        ]);
    }

    #[\Override]
    public function deleteBy(User $user): void
    {
        $this->createQueryBuilder('la')
            ->delete(LoginAttempt::class, 'la')
            ->where('la.user = :user')
            ->setParameter('user', $user->id->toBinary())
            ->getQuery()
            ->execute();
    }
}
