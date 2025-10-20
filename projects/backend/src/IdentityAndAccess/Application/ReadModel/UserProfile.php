<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\ReadModel;

use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;
use Basango\SharedKernel\Domain\DataTransfert\DataMapping;
use Basango\SharedKernel\Domain\Model\ValueObject\EmailAddress;

/**
 * Class UserProfile.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class UserProfile
{
    public function __construct(
        public UserId $id,
        public string $name,
        public EmailAddress $email,
        public \DateTimeImmutable $createdAt,
        public ?\DateTimeImmutable $updatedAt = null,
    ) {
    }

    public static function create(array $item): self
    {
        return new self(
            UserId::fromString(DataMapping::string($item, 'user_id')),
            DataMapping::string($item, 'user_name'),
            EmailAddress::from(DataMapping::string($item, 'user_email')),
            DataMapping::dateTime($item, 'user_created_at'),
            DataMapping::nullableDateTime($item, 'user_updated_at'),
        );
    }
}
