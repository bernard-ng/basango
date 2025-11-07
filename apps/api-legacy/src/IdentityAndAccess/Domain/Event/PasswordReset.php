<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Domain\Event;

use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;

/**
 * Class PasswordReset.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class PasswordReset
{
    public function __construct(
        public UserId $userId
    ) {
    }
}
