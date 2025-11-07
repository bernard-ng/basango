<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Infrastructure\Persistence\Doctrine\ORM;

use Basango\IdentityAndAccess\Domain\Exception\InvalidVerificationToken;
use Basango\IdentityAndAccess\Domain\Model\Entity\VerificationToken;
use Basango\IdentityAndAccess\Domain\Model\Repository\VerificationTokenRepository;
use Basango\IdentityAndAccess\Domain\Model\ValueObject\Secret\GeneratedToken;
use Basango\IdentityAndAccess\Domain\Model\ValueObject\TokenPurpose;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Class VerificationTokenOrmRepository.
 *
 * @extends ServiceEntityRepository<VerificationToken>
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class VerificationTokenOrmRepository extends ServiceEntityRepository implements VerificationTokenRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VerificationToken::class);
    }

    #[\Override]
    public function add(VerificationToken $verificationToken): void
    {
        $this->getEntityManager()->persist($verificationToken);
        $this->getEntityManager()->flush();
    }

    #[\Override]
    public function remove(VerificationToken $verificationToken): void
    {
        $this->getEntityManager()->remove($verificationToken);
        $this->getEntityManager()->flush();
    }

    #[\Override]
    public function getByToken(GeneratedToken $token, TokenPurpose $purpose): VerificationToken
    {
        $token = $this->findOneBy([
            'token.token' => $token->token,
            'purpose' => $purpose->value,
        ]);

        if ($token === null) {
            throw new InvalidVerificationToken();
        }

        return $token;
    }
}
