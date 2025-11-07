<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\Command;

use Basango\Aggregator\Domain\Model\Identity\SourceId;
use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;

/**
 * Class UnfollowSource.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class UnfollowSource
{
    public function __construct(
        public SourceId $sourceId,
        public UserId $userId
    ) {
    }
}
