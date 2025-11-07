<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\Query;

use Basango\FeedManagement\Domain\Model\Filters\ArticleFilters;
use Basango\FeedManagement\Domain\Model\Identity\BookmarkId;
use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;
use Basango\SharedKernel\Domain\Model\Pagination\Page;

/**
 * Class GetBookmarkedArticleList.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class GetBookmarkedArticleList
{
    public function __construct(
        public UserId $userId,
        public BookmarkId $bookmarkId,
        public Page $page = new Page(),
        public ArticleFilters $filters = new ArticleFilters()
    ) {
    }
}
