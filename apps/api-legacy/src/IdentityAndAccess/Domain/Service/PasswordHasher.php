<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Domain\Service;

use Basango\IdentityAndAccess\Domain\Model\Entity\User;

/**
 * Interface PasswordHasher.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface PasswordHasher
{
    public function hash(User $user, string $password): string;

    public function verify(User $user, string $password): bool;
}
