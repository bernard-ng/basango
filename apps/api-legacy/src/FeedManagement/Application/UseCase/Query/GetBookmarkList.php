<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\Query;

use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;
use Basango\SharedKernel\Domain\Model\Pagination\Page;

/**
 * Class GetBookmarkList.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class GetBookmarkList
{
    public function __construct(
        public UserId $userId,
        public Page $page = new Page(),
    ) {
    }
}
