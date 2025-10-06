<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Presentation\Web\Controller;

use Basango\IdentityAndAccess\Application\UseCase\Command\Register;
use Basango\IdentityAndAccess\Presentation\WriteModel\RegisterModel;
use Basango\SharedKernel\Domain\Model\ValueObject\EmailAddress;
use Basango\SharedKernel\Presentation\Web\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Class RegisterController.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class RegisterController extends AbstractController
{
    #[Route(
        path: '/api/register',
        name: 'identity_and_access_register',
        methods: ['POST']
    )]
    public function __invoke(#[MapRequestPayload] RegisterModel $model): JsonResponse
    {
        $this->handleCommand(new Register(
            $model->name,
            EmailAddress::from($model->email),
            $model->password
        ));

        return new JsonResponse(status: 201);
    }
}
