<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Domain\Event;

use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;

/**
 * Class PasswordUpdated.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class PasswordUpdated
{
    public function __construct(
        public UserId $userId
    ) {
    }
}
