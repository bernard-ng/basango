<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\CommandHandler;

use Basango\FeedManagement\Application\UseCase\Command\UpdateBookmark;
use Basango\FeedManagement\Domain\Model\Repository\BookmarkRepository;
use Basango\IdentityAndAccess\Domain\Exception\PermissionNotGranted;
use Basango\SharedKernel\Application\Messaging\CommandHandler;

/**
 * Class UpdateBookmarkHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class UpdateBookmarkHandler implements CommandHandler
{
    public function __construct(
        private BookmarkRepository $bookmarkRepository
    ) {
    }

    public function __invoke(UpdateBookmark $command): void
    {
        $bookmark = $this->bookmarkRepository->getById($command->bookmarkId);
        if ($bookmark->user->id !== $command->userId) {
            throw PermissionNotGranted::withReason('feed_management.exceptions.cannot_update_bookmark');
        }

        $bookmark = match ($command->isPublic) {
            true => $bookmark->markAsPublic(),
            false => $bookmark->markAsPrivate(),
        };
        $bookmark->updateInfos($command->name, $command->description);

        $this->bookmarkRepository->add($bookmark);
    }
}
