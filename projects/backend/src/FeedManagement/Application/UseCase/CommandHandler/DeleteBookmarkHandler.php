<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\CommandHandler;

use Basango\FeedManagement\Application\UseCase\Command\DeleteBookmark;
use Basango\FeedManagement\Domain\Model\Repository\BookmarkRepository;
use Basango\IdentityAndAccess\Domain\Exception\PermissionNotGranted;
use Basango\SharedKernel\Application\Messaging\CommandHandler;

/**
 * Class DeleteBookmarkHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class DeleteBookmarkHandler implements CommandHandler
{
    public function __construct(
        private BookmarkRepository $bookmarkRepository,
    ) {
    }

    public function __invoke(DeleteBookmark $command): void
    {
        $bookmark = $this->bookmarkRepository->getById($command->bookmarkId);
        if ($bookmark->user->id !== $command->userId) {
            throw PermissionNotGranted::withReason('feed_management.exceptions.cannot_delete_bookmark');
        }

        $this->bookmarkRepository->remove($bookmark);
    }
}
