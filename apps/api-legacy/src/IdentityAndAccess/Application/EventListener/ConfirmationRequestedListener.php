<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\EventListener;

use Basango\IdentityAndAccess\Application\Mailing\ConfirmationRequestedEmail;
use Basango\IdentityAndAccess\Domain\Event\ConfirmationRequested;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\SharedKernel\Application\Mailing\Mailer;
use Basango\SharedKernel\Domain\EventListener\EventListener;

/**
 * Class UserRegisteredListener.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class ConfirmationRequestedListener implements EventListener
{
    public function __construct(
        private Mailer $mailer,
        private UserRepository $userRepository
    ) {
    }

    public function __invoke(ConfirmationRequested $event): void
    {
        $user = $this->userRepository->getById($event->userId);
        $email = new ConfirmationRequestedEmail($user->email, $user->name, $event->token);

        $this->mailer->send($email);
    }
}
