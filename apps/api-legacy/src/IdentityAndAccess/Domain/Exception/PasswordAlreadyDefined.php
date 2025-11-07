<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Domain\Exception;

use Basango\SharedKernel\Domain\Exception\UserFacingError;

/**
 * Class PasswordAlreadyDefined.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class PasswordAlreadyDefined extends \DomainException implements UserFacingError
{
    #[\Override]
    public function translationId(): string
    {
        return 'identity_and_access.exceptions.password_already_defined';
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
