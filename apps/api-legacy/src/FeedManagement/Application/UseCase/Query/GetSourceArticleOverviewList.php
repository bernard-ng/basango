<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\Query;

use Basango\Aggregator\Domain\Model\Identity\SourceId;
use Basango\FeedManagement\Domain\Model\Filters\ArticleFilters;
use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;
use Basango\SharedKernel\Domain\Model\Pagination\Page;

/**
 * Class GetArticleOverviewList.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class GetSourceArticleOverviewList
{
    public function __construct(
        public SourceId $sourceId,
        public UserId $userId,
        public Page $page = new Page(),
        public ArticleFilters $filters = new ArticleFilters(),
    ) {
    }
}
