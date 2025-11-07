<?php

declare(strict_types=1);

namespace Basango\SharedKernel\Domain\Tracking;

use Basango\SharedKernel\Domain\Model\ValueObject\Tracking\ClientProfile;
use Basango\SharedKernel\Domain\Model\ValueObject\Tracking\Device;
use Basango\SharedKernel\Domain\Model\ValueObject\Tracking\GeoLocation;

/**
 * Class ClientProfiler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface ClientProfiler
{
    public function detect(ClientProfile $profile): Device;

    public function locate(ClientProfile $profile): GeoLocation;

    public function locateCountry(ClientProfile $profile): ?string;
}
