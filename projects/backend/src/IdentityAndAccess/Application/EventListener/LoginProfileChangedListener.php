<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\EventListener;

use Basango\IdentityAndAccess\Application\Mailing\LoginProfileChangedEmail;
use Basango\IdentityAndAccess\Domain\Event\LoginProfileChanged;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\SharedKernel\Application\Mailing\Mailer;
use Basango\SharedKernel\Domain\EventListener\EventListener;

/**
 * Class LoginProfileChangedListener.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class LoginProfileChangedListener implements EventListener
{
    public function __construct(
        private Mailer $mailer,
        private UserRepository $userRepository
    ) {
    }

    public function __invoke(LoginProfileChanged $event): void
    {
        $user = $this->userRepository->getById($event->userId);
        $email = new LoginProfileChangedEmail($user->email, $event->device, $event->location);

        $this->mailer->send($email);
    }
}
