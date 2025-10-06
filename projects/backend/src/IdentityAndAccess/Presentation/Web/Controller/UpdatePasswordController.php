<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Presentation\Web\Controller;

use Basango\IdentityAndAccess\Application\UseCase\Command\UpdatePassword;
use Basango\IdentityAndAccess\Presentation\WriteModel\UpdatePasswordModel;
use Basango\SharedKernel\Presentation\Web\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Class UpdatePasswordController.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class UpdatePasswordController extends AbstractController
{
    #[Route(
        path: '/api/password/update',
        name: 'identity_and_access_update_password',
        methods: ['POST']
    )]
    public function __invoke(#[MapRequestPayload] UpdatePasswordModel $model): JsonResponse
    {
        $securityUser = $this->getSecurityUser();
        $this->handleCommand(new UpdatePassword(
            $securityUser->userId,
            $model->current,
            $model->password
        ));

        return new JsonResponse(status: 200);
    }
}
