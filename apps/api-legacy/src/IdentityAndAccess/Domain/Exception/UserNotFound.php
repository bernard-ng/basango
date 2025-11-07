<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Domain\Exception;

use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;
use Basango\SharedKernel\Domain\Exception\UserFacingError;
use Basango\SharedKernel\Domain\Model\ValueObject\EmailAddress;

/**
 * Class UserNotFound.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class UserNotFound extends \DomainException implements UserFacingError
{
    public static function withEmail(EmailAddress $email): self
    {
        return new self(\sprintf('User with email %s was not found', $email->value));
    }

    public static function withId(UserId $userId): self
    {
        return new self(\sprintf('User with id %s was not found', $userId->toString()));
    }

    #[\Override]
    public function translationId(): string
    {
        return 'identity_and_access.exceptions.user_not_found';
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
