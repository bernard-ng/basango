<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\Command;

use Basango\FeedManagement\Domain\Model\Identity\BookmarkId;
use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;

/**
 * Class UpdateBookmark.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class UpdateBookmark
{
    public function __construct(
        public UserId $userId,
        public BookmarkId $bookmarkId,
        public string $name,
        public ?string $description,
        public bool $isPublic = false,
    ) {
    }
}
