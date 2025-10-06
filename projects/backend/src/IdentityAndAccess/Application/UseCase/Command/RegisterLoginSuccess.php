<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\UseCase\Command;

use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;
use Basango\SharedKernel\Domain\Model\ValueObject\Tracking\ClientProfile;

/**
 * Class RegisterLogin.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class RegisterLoginSuccess
{
    public function __construct(
        public UserId $userId,
        public ClientProfile $profile
    ) {
    }
}
