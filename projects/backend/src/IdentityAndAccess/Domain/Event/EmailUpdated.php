<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Domain\Event;

use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;
use Basango\SharedKernel\Domain\Model\ValueObject\EmailAddress;

/**
 * Class EmailUpdated.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class EmailUpdated
{
    public function __construct(
        public UserId $userId,
        public EmailAddress $previous,
        public EmailAddress $current
    ) {
    }
}
