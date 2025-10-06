<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\EventListener;

use Basango\IdentityAndAccess\Application\Mailing\AccountUnlockedEmail;
use Basango\IdentityAndAccess\Domain\Event\AccountUnlocked;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\SharedKernel\Application\Mailing\Mailer;
use Basango\SharedKernel\Domain\EventListener\EventListener;

/**
 * Class AccountUnlockedListener.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class AccountUnlockedListener implements EventListener
{
    public function __construct(
        private Mailer $mailer,
        private UserRepository $userRepository
    ) {
    }

    public function __invoke(AccountUnlocked $event): void
    {
        $user = $this->userRepository->getById($event->userId);
        $email = new AccountUnlockedEmail($user->email);

        $this->mailer->send($email);
    }
}
