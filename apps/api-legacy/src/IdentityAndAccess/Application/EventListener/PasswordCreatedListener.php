<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\EventListener;

use Basango\IdentityAndAccess\Application\Mailing\PasswordCreatedEmail;
use Basango\IdentityAndAccess\Domain\Event\PasswordCreated;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\SharedKernel\Application\Mailing\Mailer;
use Basango\SharedKernel\Domain\EventListener\EventListener;

/**
 * Class PasswordCreatedListener.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class PasswordCreatedListener implements EventListener
{
    public function __construct(
        private Mailer $mailer,
        private UserRepository $userRepository
    ) {
    }

    public function __invoke(PasswordCreated $event): void
    {
        $user = $this->userRepository->getById($event->userId);
        $email = new PasswordCreatedEmail($user->email, $event->password);

        $this->mailer->send($email);
    }
}
