<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\EventListener;

use Basango\IdentityAndAccess\Application\Mailing\PasswordUpdatedEmail;
use Basango\IdentityAndAccess\Domain\Event\PasswordUpdated;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\SharedKernel\Application\Mailing\Mailer;
use Basango\SharedKernel\Domain\EventListener\EventListener;

/**
 * Class PasswordUpdatedListener.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class PasswordUpdatedListener implements EventListener
{
    public function __construct(
        private Mailer $mailer,
        private UserRepository $userRepository
    ) {
    }

    public function __invoke(PasswordUpdated $event): void
    {
        $user = $this->userRepository->getById($event->userId);
        $email = new PasswordUpdatedEmail($user->email);

        $this->mailer->send($email);
    }
}
