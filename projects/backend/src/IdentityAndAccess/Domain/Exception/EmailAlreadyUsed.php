<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Domain\Exception;

use Basango\SharedKernel\Domain\Exception\UserFacingError;
use Basango\SharedKernel\Domain\Model\ValueObject\EmailAddress;

/**
 * Class EmailAlreadyUsed.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class EmailAlreadyUsed extends \DomainException implements UserFacingError
{
    public static function with(EmailAddress $email): self
    {
        return new self(sprintf('the %s email is already used by another user', $email->value));
    }

    #[\Override]
    public function translationId(): string
    {
        return 'identity_and_access.exceptions.email_already_used';
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
