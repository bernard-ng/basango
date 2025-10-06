<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Domain\Model\ValueObject;

/**
 * Class Role.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
enum Role: string
{
    case USER = 'ROLE_USER';
    case ADMIN = 'ROLE_ADMIN';
}
