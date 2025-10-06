<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\Command;

use Basango\Aggregator\Domain\Model\Identity\ArticleId;
use Basango\FeedManagement\Domain\Model\Identity\BookmarkId;
use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;

/**
 * Class RemoveArticleFromBookmark.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class RemoveArticleFromBookmark
{
    public function __construct(
        public UserId $userId,
        public ArticleId $articleId,
        public BookmarkId $bookmarkId,
    ) {
    }
}
