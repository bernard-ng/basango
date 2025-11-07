<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\EventListener;

use Basango\IdentityAndAccess\Application\Mailing\AccountLockedEmail;
use Basango\IdentityAndAccess\Domain\Event\AccountLocked;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\SharedKernel\Application\Mailing\Mailer;
use Basango\SharedKernel\Domain\EventListener\EventListener;

/**
 * Class AccountLockedListener.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class AccountLockedListener implements EventListener
{
    public function __construct(
        private Mailer $mailer,
        private UserRepository $userRepository
    ) {
    }

    public function __invoke(AccountLocked $event): void
    {
        $user = $this->userRepository->getById($event->userId);
        $email = new AccountLockedEmail($user->email, $event->token);

        $this->mailer->send($email);
    }
}
