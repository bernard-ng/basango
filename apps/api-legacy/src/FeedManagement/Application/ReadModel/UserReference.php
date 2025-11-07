<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\ReadModel;

use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;
use Basango\SharedKernel\Domain\DataTransfert\DataMapping;

/**
 * Class UserReference.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class UserReference
{
    public function __construct(
        public UserId $id,
        public string $name,
    ) {
    }

    public static function create(array $item): self
    {
        return new self(
            UserId::fromString(DataMapping::string($item, 'user_id')),
            DataMapping::string($item, 'user_name')
        );
    }
}
