<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Domain\Model\Repository;

use Basango\IdentityAndAccess\Domain\Model\Entity\User;
use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;
use Basango\SharedKernel\Domain\Model\ValueObject\EmailAddress;

/**
 * Interface UserRepository.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface UserRepository
{
    public function add(User $user): void;

    public function remove(User $user): void;

    public function getById(UserId $userId): User;

    public function getByEmail(EmailAddress $email): ?User;
}
