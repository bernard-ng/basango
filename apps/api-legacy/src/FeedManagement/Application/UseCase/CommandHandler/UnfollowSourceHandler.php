<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\CommandHandler;

use Basango\FeedManagement\Application\UseCase\Command\UnfollowSource;
use Basango\FeedManagement\Domain\Exception\FollowedSourceNotFound;
use Basango\FeedManagement\Domain\Model\Entity\FollowedSource;
use Basango\FeedManagement\Domain\Model\Repository\FollowedSourceRepository;
use Basango\SharedKernel\Application\Messaging\CommandHandler;

/**
 * Class UnfollowSourceHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class UnfollowSourceHandler implements CommandHandler
{
    public function __construct(
        private FollowedSourceRepository $followedSourceRepository
    ) {
    }

    public function __invoke(UnfollowSource $command): void
    {
        $followedSource = $this->followedSourceRepository->getByUserId(
            $command->userId,
            $command->sourceId
        );

        if (! $followedSource instanceof FollowedSource) {
            throw FollowedSourceNotFound::with($command->userId, $command->sourceId);
        }

        $this->followedSourceRepository->remove($followedSource);
    }
}
