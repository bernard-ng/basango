<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Domain\Model\Entity;

use Basango\Aggregator\Domain\Model\Entity\Source;
use Basango\FeedManagement\Domain\Model\Identity\FollowedSourceId;
use Basango\IdentityAndAccess\Domain\Model\Entity\User;

/**
 * Class FollowedSource.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
readonly class FollowedSource
{
    public FollowedSourceId $id;

    public function __construct(
        public Source $source,
        public User $follower,
        public \DateTimeImmutable $createdAt = new \DateTimeImmutable(),
    ) {
        $this->id = new FollowedSourceId();
    }
}
