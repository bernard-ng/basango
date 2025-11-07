<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Infrastructure\Framework\Symfony\Security;

use Basango\IdentityAndAccess\Domain\Model\Entity\User;
use Basango\IdentityAndAccess\Domain\Service\PasswordHasher;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Class UserPasswordHasher.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class UserPasswordHasher implements PasswordHasher
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher
    ) {
    }

    #[\Override]
    public function hash(User $user, string $password): string
    {
        $securityUser = SecurityUser::create($user);
        return $this->passwordHasher->hashPassword($securityUser, $password);
    }

    #[\Override]
    public function verify(User $user, string $password): bool
    {
        $securityUser = SecurityUser::create($user);
        return $this->passwordHasher->isPasswordValid($securityUser, $password);
    }
}
