<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Domain\Model\Repository;

use Basango\Aggregator\Domain\Model\Identity\SourceId;
use Basango\FeedManagement\Domain\Model\Entity\FollowedSource;
use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;

/**
 * Interface FollowedSourceRepository.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface FollowedSourceRepository
{
    public function add(FollowedSource $followedSource): void;

    public function remove(FollowedSource $followedSource): void;

    public function getByUserId(UserId $userId, SourceId $sourceId): ?FollowedSource;
}
