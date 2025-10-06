<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\UseCase\Command;

use Basango\IdentityAndAccess\Domain\Model\ValueObject\Roles;
use Basango\SharedKernel\Domain\Model\ValueObject\EmailAddress;

/**
 * Class Register.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class Register
{
    public function __construct(
        public string $name,
        public EmailAddress $email,
        public ?string $password,
        public Roles $roles = new Roles()
    ) {
    }
}
