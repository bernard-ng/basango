<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\CommandHandler;

use Basango\FeedManagement\Application\UseCase\Command\CreateBookmark;
use Basango\FeedManagement\Domain\Model\Entity\Bookmark;
use Basango\FeedManagement\Domain\Model\Repository\BookmarkRepository;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\SharedKernel\Application\Messaging\CommandHandler;

/**
 * Class CreateBookHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class CreateBookHandler implements CommandHandler
{
    public function __construct(
        private UserRepository $userRepository,
        private BookmarkRepository $bookmarkRepository
    ) {
    }

    public function __invoke(CreateBookmark $command): void
    {
        $user = $this->userRepository->getById($command->userId);
        $bookmark = Bookmark::create($user, $command->name, $command->description);

        $this->bookmarkRepository->add($bookmark);
    }
}
