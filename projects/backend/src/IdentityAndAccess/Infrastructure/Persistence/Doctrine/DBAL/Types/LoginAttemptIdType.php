<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Infrastructure\Persistence\Doctrine\DBAL\Types;

use Basango\IdentityAndAccess\Domain\Model\Identity\LoginAttemptId;
use Symfony\Bridge\Doctrine\Types\AbstractUidType;

/**
 * Class LoginAttemptId.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class LoginAttemptIdType extends AbstractUidType
{
    #[\Override]
    public function getName(): string
    {
        return 'login_attempt_id';
    }

    #[\Override]
    protected function getUidClass(): string
    {
        return LoginAttemptId::class;
    }
}
