<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\CommandHandler;

use Basango\Aggregator\Domain\Model\Repository\ArticleRepository;
use Basango\FeedManagement\Application\UseCase\Command\AddArticleToBookmark;
use Basango\FeedManagement\Domain\Model\Repository\BookmarkRepository;
use Basango\IdentityAndAccess\Domain\Exception\PermissionNotGranted;
use Basango\SharedKernel\Application\Messaging\CommandHandler;

/**
 * Class AddArticleToBookmarkHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class AddArticleToBookmarkHandler implements CommandHandler
{
    public function __construct(
        private BookmarkRepository $bookmarkRepository,
        private ArticleRepository $articleRepository
    ) {
    }

    public function __invoke(AddArticleToBookmark $command): void
    {
        $bookmark = $this->bookmarkRepository->getById($command->bookmarkId);
        if ($bookmark->user->id !== $command->userId) {
            throw PermissionNotGranted::withReason('feed_management.exceptions.cannot_add_article_to_bookmark');
        }

        $article = $this->articleRepository->getById($command->articleId);

        $bookmark->addArticle($article);
        $this->bookmarkRepository->add($bookmark);
    }
}
