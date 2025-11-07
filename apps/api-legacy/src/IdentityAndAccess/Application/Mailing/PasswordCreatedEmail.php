<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\Mailing;

use Basango\IdentityAndAccess\Domain\Model\ValueObject\Secret\GeneratedCode;
use Basango\SharedKernel\Application\Mailing\EmailDefinition;
use Basango\SharedKernel\Domain\Model\ValueObject\EmailAddress;

/**
 * Class PasswordCreatedEmail.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class PasswordCreatedEmail implements EmailDefinition
{
    public function __construct(
        private EmailAddress $recipient,
        private GeneratedCode $code
    ) {
    }

    #[\Override]
    public function recipient(): EmailAddress
    {
        return $this->recipient;
    }

    #[\Override]
    public function subject(): string
    {
        return 'identity_and_access.emails.subjects.password_created';
    }

    #[\Override]
    public function subjectVariables(): array
    {
        return [];
    }

    #[\Override]
    public function template(): string
    {
        return 'identity_and_access/password_created';
    }

    #[\Override]
    public function templateVariables(): array
    {
        return [
            'code' => $this->code,
        ];
    }

    #[\Override]
    public function locale(): string
    {
        return 'fr';
    }

    #[\Override]
    public function getDomain(): string
    {
        return 'identity_and_access';
    }
}
