<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\Query;

use Basango\Aggregator\Domain\Model\Identity\SourceId;
use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;

/**
 * Class GetSourceDetails.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class GetSourceDetails
{
    public function __construct(
        public SourceId $sourceId,
        public UserId $userId,
    ) {
    }
}
