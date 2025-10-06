<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Presentation\Web\Controller;

use Basango\FeedManagement\Application\UseCase\Command\RemoveCommentFromArticle;
use Basango\FeedManagement\Domain\Model\Identity\CommentId;
use Basango\SharedKernel\Presentation\Web\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;

/**
 * Class AddCommentToArticleController.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class RemoveCommentFromArticleController extends AbstractController
{
    #[Route(
        path: '/api/feed/articles/{articleId}/comments/{commentId}',
        name: 'feed_management_remove_comment_from_article',
        requirements: [
            'articleId' => Requirement::UUID_V7,
            'commentId' => Requirement::UUID_V7,
        ],
        methods: ['DELETE']
    )]
    public function __invoke(CommentId $commentId): JsonResponse
    {
        $securityUser = $this->getSecurityUser();
        $this->handleCommand(new RemoveCommentFromArticle($securityUser->userId, $commentId));

        return new JsonResponse(status: Response::HTTP_OK);
    }
}
