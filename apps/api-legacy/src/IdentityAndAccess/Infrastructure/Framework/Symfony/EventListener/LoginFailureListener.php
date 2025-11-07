<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Infrastructure\Framework\Symfony\EventListener;

use Basango\IdentityAndAccess\Application\UseCase\Command\RegisterLoginAttempt;
use Basango\IdentityAndAccess\Infrastructure\Framework\Symfony\Security\SecurityUser;
use Basango\SharedKernel\Application\Messaging\CommandBus;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;
use Symfony\Component\Security\Http\Event\LoginFailureEvent;

/**
 * Class LoginFailureListener.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
#[AsEventListener(LoginFailureEvent::class)]
final readonly class LoginFailureListener
{
    public function __construct(
        private CommandBus $commandBus
    ) {
    }

    public function __invoke(LoginFailureEvent $event): void
    {
        /** @var SecurityUser|null $user */
        $user = $event->getPassport()?->getUser();

        if ($user && $event->getException() instanceof BadCredentialsException) {
            $this->commandBus->handle(new RegisterLoginAttempt($user->userId));
        }
    }
}
