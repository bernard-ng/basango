<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Presentation\Web\Controller;

use Basango\IdentityAndAccess\Application\UseCase\Command\ConfirmAccount;
use Basango\IdentityAndAccess\Domain\Model\ValueObject\Secret\GeneratedToken;
use Basango\SharedKernel\Presentation\Web\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;

/**
 * Class UnlockAccountController.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class ConfirmAccountController extends AbstractController
{
    #[Route(
        path: '/api/account/confirm/{token}',
        name: 'identity_and_access_confirm_account',
        requirements: [
            'token' => Requirement::ASCII_SLUG,
        ],
        methods: ['GET']
    )]
    public function __invoke(string $token): JsonResponse
    {
        $token = new GeneratedToken($token);
        $this->handleCommand(new ConfirmAccount($token));

        return new JsonResponse(status: 200);
    }
}
