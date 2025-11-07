<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Domain\Event;

use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;
use Basango\SharedKernel\Domain\Model\ValueObject\Tracking\Device;
use Basango\SharedKernel\Domain\Model\ValueObject\Tracking\GeoLocation;

/**
 * Class LoginProfileChanged.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class LoginProfileChanged
{
    public function __construct(
        public UserId $userId,
        public Device $device,
        public GeoLocation $location
    ) {
    }
}
