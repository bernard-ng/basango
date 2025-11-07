<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Infrastructure\Framework\Symfony\EventListener;

use Basango\IdentityAndAccess\Application\UseCase\Command\RegisterLoginSuccess;
use Basango\IdentityAndAccess\Infrastructure\Framework\Symfony\Security\SecurityUser;
use Basango\SharedKernel\Application\Messaging\CommandBus;
use Basango\SharedKernel\Domain\Model\ValueObject\Tracking\ClientProfile;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\IpUtils;
use Symfony\Component\Security\Http\Event\InteractiveLoginEvent;

/**
 * Class LoginSuccessListener.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
#[AsEventListener(InteractiveLoginEvent::class)]
final readonly class LoginSuccessListener
{
    public function __construct(
        private CommandBus $commandBus,
    ) {
    }

    public function __invoke(InteractiveLoginEvent $event): void
    {
        /** @var SecurityUser|null $user */
        $user = $event->getAuthenticationToken()->getUser();

        if ($user !== null) {
            $profile = new ClientProfile(
                IpUtils::anonymize((string) $event->getRequest()->getClientIp(), 1),
                $event->getRequest()->headers->get('User-Agent'),
                $event->getRequest()->server->all()
            );

            $this->commandBus->handle(new RegisterLoginSuccess($user->userId, $profile));
        }
    }
}
