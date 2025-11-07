<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\UseCase\Command;

use Basango\SharedKernel\Domain\Model\ValueObject\EmailAddress;

/**
 * Class RequestPassword.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class RequestPassword
{
    public function __construct(
        public EmailAddress $email
    ) {
    }
}
