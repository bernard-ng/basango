<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\EventListener;

use Basango\IdentityAndAccess\Application\Mailing\AccountConfirmedEmail;
use Basango\IdentityAndAccess\Domain\Event\AccountConfirmed;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\SharedKernel\Application\Mailing\Mailer;
use Basango\SharedKernel\Domain\EventListener\EventListener;

/**
 * Class AccountConfirmedListener.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class AccountConfirmedListener implements EventListener
{
    public function __construct(
        private Mailer $mailer,
        private UserRepository $userRepository
    ) {
    }

    public function __invoke(AccountConfirmed $event): void
    {
        $user = $this->userRepository->getById($event->userId);
        $email = new AccountConfirmedEmail($user->email, false, null);

        $this->mailer->send($email);
    }
}
