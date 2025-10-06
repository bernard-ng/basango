<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Domain\Exception;

use Basango\SharedKernel\Domain\Exception\UserFacingError;

/**
 * Class UserNotConfirmed.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class AccountNotConfirmed extends \DomainException implements UserFacingError
{
    #[\Override]
    public function translationId(): string
    {
        return 'identity_and_access.exceptions.account_not_confirmed';
    }

    #[\Override]
    public function translationParameters(): array
    {
        return [];
    }

    #[\Override]
    public function translationDomain(): string
    {
        return 'identity_and_access';
    }
}
