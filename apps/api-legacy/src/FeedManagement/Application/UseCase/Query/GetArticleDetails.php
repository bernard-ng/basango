<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\Query;

use Basango\Aggregator\Domain\Model\Identity\ArticleId;
use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;

/**
 * Class GetArticleDetails.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class GetArticleDetails
{
    public function __construct(
        public ArticleId $id,
        public UserId $userId
    ) {
    }
}
