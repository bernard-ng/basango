<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Presentation\Web\Controller;

use Basango\FeedManagement\Application\UseCase\Command\CreateBookmark;
use Basango\FeedManagement\Presentation\WriteModel\CreateBookmarkModel;
use Basango\SharedKernel\Presentation\Web\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Class CreateBookmarkController.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class CreateBookmarkController extends AbstractController
{
    #[Route(
        path: '/api/feed/bookmarks',
        name: 'feed_management_create_bookmark',
        methods: ['POST']
    )]
    public function __invoke(#[MapRequestPayload] CreateBookmarkModel $model): JsonResponse
    {
        $securityUser = $this->getSecurityUser();
        $this->handleCommand(new CreateBookmark(
            $securityUser->userId,
            $model->name,
            $model->description
        ));

        return new JsonResponse(status: Response::HTTP_CREATED);
    }
}
