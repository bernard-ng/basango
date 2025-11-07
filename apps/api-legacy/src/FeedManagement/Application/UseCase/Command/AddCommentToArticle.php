<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\Command;

use Basango\Aggregator\Domain\Model\Identity\ArticleId;
use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;

/**
 * Class AddCommentToArticle.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class AddCommentToArticle
{
    public function __construct(
        public UserId $userId,
        public ArticleId $articleId,
        public string $content,
    ) {
    }
}
