<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\EventListener;

use Basango\IdentityAndAccess\Application\Mailing\PasswordResetEmail;
use Basango\IdentityAndAccess\Domain\Event\PasswordReset;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\SharedKernel\Application\Mailing\Mailer;
use Basango\SharedKernel\Domain\EventListener\EventListener;

/**
 * Class PasswordForgottenListener.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class PasswordResetListener implements EventListener
{
    public function __construct(
        private Mailer $mailer,
        private UserRepository $userRepository
    ) {
    }

    public function __invoke(PasswordReset $event): void
    {
        $user = $this->userRepository->getById($event->userId);
        $email = new PasswordResetEmail($user->email);

        $this->mailer->send($email);
    }
}
