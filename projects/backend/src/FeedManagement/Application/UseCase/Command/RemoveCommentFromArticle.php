<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\Command;

use Basango\FeedManagement\Domain\Model\Identity\CommentId;
use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;

/**
 * Class RemoveCommentFromArticle.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class RemoveCommentFromArticle
{
    public function __construct(
        public UserId $userId,
        public CommentId $commentId
    ) {
    }
}
