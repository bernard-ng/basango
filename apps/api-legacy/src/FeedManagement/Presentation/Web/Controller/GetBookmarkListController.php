<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Presentation\Web\Controller;

use Basango\FeedManagement\Application\UseCase\Query\GetBookmarkList;
use Basango\SharedKernel\Domain\Model\Pagination\Page;
use Basango\SharedKernel\Presentation\Web\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Class GetBookmarkListController.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class GetBookmarkListController extends AbstractController
{
    #[Route(
        path: '/api/feed/bookmarks',
        name: 'feed_management_bookmark_list',
        methods: ['GET']
    )]
    public function __invoke(#[MapQueryString] Page $page): JsonResponse
    {
        $securityUser = $this->getSecurityUser();
        $data = $this->handleQuery(new GetBookmarkList($securityUser->userId, $page));

        return JsonResponse::fromJsonString($this->serialize($data));
    }
}
