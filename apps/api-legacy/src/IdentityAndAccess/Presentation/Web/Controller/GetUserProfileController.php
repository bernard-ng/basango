<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Presentation\Web\Controller;

use Basango\IdentityAndAccess\Application\UseCase\Query\GetUserProfile;
use Basango\SharedKernel\Presentation\Web\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Class GetUserProfileController.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class GetUserProfileController extends AbstractController
{
    #[Route(
        path: '/api/me',
        name: 'identity_and_access_me',
        methods: ['GET']
    )]
    public function __invoke(): JsonResponse
    {
        $security = $this->getSecurityUser();
        $data = $this->handleQuery(new GetUserProfile($security->userId));

        return JsonResponse::fromJsonString($this->serialize($data));
    }
}
