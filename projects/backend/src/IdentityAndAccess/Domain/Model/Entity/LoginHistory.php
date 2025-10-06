<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Domain\Model\Entity;

use Basango\IdentityAndAccess\Domain\Event\LoginProfileChanged;
use Basango\IdentityAndAccess\Domain\Model\Identity\LoginHistoryId;
use Basango\SharedKernel\Domain\EventDispatcher\EventEmitterTrait;
use Basango\SharedKernel\Domain\Model\ValueObject\Tracking\Device;
use Basango\SharedKernel\Domain\Model\ValueObject\Tracking\GeoLocation;

/**
 * Class LoginHistory.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
class LoginHistory
{
    use EventEmitterTrait;

    public readonly LoginHistoryId $id;

    private function __construct(
        public readonly User $user,
        public readonly ?string $ipAddress,
        public readonly Device $device,
        public readonly GeoLocation $location,
        public readonly \DateTimeImmutable $createdAt = new \DateTimeImmutable()
    ) {
        $this->id = new LoginHistoryId();
    }

    public static function create(User $user, ?string $userIp, Device $device, GeoLocation $location): self
    {
        return new self($user, $userIp, $device, $location);
    }

    public function matchPreviousProfile(self $previous): self
    {
        if (
            $this->ipAddress !== $previous->ipAddress ||
            $this->location->city !== $previous->location->city ||
            $this->location->country !== $previous->location->country ||
            $this->device->operatingSystem !== $previous->device->operatingSystem
        ) {
            $this->emitEvent(new LoginProfileChanged($this->user->id, $this->device, $this->location));
        }

        return $this;
    }
}
