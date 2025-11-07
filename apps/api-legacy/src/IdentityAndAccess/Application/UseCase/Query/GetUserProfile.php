<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\UseCase\Query;

use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;

/**
 * Class GetUserProfile.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class GetUserProfile
{
    public function __construct(
        public UserId $userId
    ) {
    }
}
