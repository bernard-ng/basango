<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\Query;

use Basango\Aggregator\Domain\Model\Identity\ArticleId;
use Basango\SharedKernel\Domain\Model\Pagination\Page;

/**
 * Class GetArticleCommentListHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class GetArticleCommentList
{
    public function __construct(
        public ArticleId $articleId,
        public Page $page = new Page(),
    ) {
    }
}
