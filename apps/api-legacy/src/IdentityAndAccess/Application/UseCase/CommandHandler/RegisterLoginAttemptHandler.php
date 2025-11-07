<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\UseCase\CommandHandler;

use Basango\IdentityAndAccess\Application\UseCase\Command\LockAccount;
use Basango\IdentityAndAccess\Application\UseCase\Command\RegisterLoginAttempt;
use Basango\IdentityAndAccess\Domain\Model\Entity\LoginAttempt;
use Basango\IdentityAndAccess\Domain\Model\Repository\LoginAttemptRepository;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\SharedKernel\Application\Messaging\CommandBus;
use Basango\SharedKernel\Application\Messaging\CommandHandler;

/**
 * Class RegisterLoginAttemptHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class RegisterLoginAttemptHandler implements CommandHandler
{
    private const int ATTEMPTS_LIMIT = 3;

    public function __construct(
        private UserRepository $userRepository,
        private LoginAttemptRepository $loginAttemptRepository,
        private CommandBus $commandBus
    ) {
    }

    public function __invoke(RegisterLoginAttempt $command): void
    {
        $user = $this->userRepository->getById($command->userId);
        $attempts = $this->loginAttemptRepository->countBy($user);

        if ($attempts < self::ATTEMPTS_LIMIT) {
            $this->loginAttemptRepository->add(LoginAttempt::create($user));
        } elseif ($user->isLocked === false) {
            $this->commandBus->handle(new LockAccount($user->id));
        }
    }
}
