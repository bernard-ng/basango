<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\UseCase\QueryHandler;

use Basango\IdentityAndAccess\Application\ReadModel\UserProfile;
use Basango\IdentityAndAccess\Application\UseCase\Query\GetUserProfile;
use Basango\SharedKernel\Application\Messaging\QueryHandler;

/**
 * Interface GetUserProfileHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface GetUserProfileHandler extends QueryHandler
{
    public function __invoke(GetUserProfile $query): UserProfile;
}
