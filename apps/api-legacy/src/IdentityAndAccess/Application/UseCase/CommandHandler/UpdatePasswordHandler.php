<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\UseCase\CommandHandler;

use Basango\IdentityAndAccess\Application\UseCase\Command\UpdatePassword;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\IdentityAndAccess\Domain\Service\PasswordHasher;
use Basango\SharedKernel\Application\Messaging\CommandHandler;
use Basango\SharedKernel\Domain\EventDispatcher\EventDispatcher;

/**
 * Class UpdatePasswordHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class UpdatePasswordHandler implements CommandHandler
{
    public function __construct(
        private UserRepository $userRepository,
        private PasswordHasher $passwordHasher,
        private EventDispatcher $eventDispatcher
    ) {
    }

    public function __invoke(UpdatePassword $command): void
    {
        $user = $this->userRepository->getById($command->userId);
        $user->updatePassword($command->current, $command->password, $this->passwordHasher);

        $this->userRepository->add($user);
        $this->eventDispatcher->dispatch($user->releaseEvents());
    }
}
