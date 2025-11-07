<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\CommandHandler;

use Basango\Aggregator\Domain\Model\Repository\ArticleRepository;
use Basango\FeedManagement\Application\UseCase\Command\AddCommentToArticle;
use Basango\FeedManagement\Domain\Model\Entity\Comment;
use Basango\FeedManagement\Domain\Model\Repository\CommentRepository;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\SharedKernel\Application\Messaging\CommandHandler;

/**
 * Class AddCommentToArticleHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class AddCommentToArticleHandler implements CommandHandler
{
    public function __construct(
        public UserRepository $userRepository,
        public ArticleRepository $articleRepository,
        public CommentRepository $commentRepository
    ) {
    }

    public function __invoke(AddCommentToArticle $comment): void
    {
        $user = $this->userRepository->getById($comment->userId);
        $article = $this->articleRepository->getById($comment->articleId);

        $comment = Comment::create($user, $article, $comment->content);
        $this->commentRepository->add($comment);
    }
}
