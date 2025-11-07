<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\UseCase\CommandHandler;

use Basango\IdentityAndAccess\Application\UseCase\Command\UnlockAccount;
use Basango\IdentityAndAccess\Domain\Model\Repository\LoginAttemptRepository;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\IdentityAndAccess\Domain\Model\Repository\VerificationTokenRepository;
use Basango\IdentityAndAccess\Domain\Model\ValueObject\TokenPurpose;
use Basango\SharedKernel\Application\Messaging\CommandHandler;
use Basango\SharedKernel\Domain\EventDispatcher\EventDispatcher;

/**
 * Class ResetPasswordHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class UnlockAccountHandler implements CommandHandler
{
    public function __construct(
        private UserRepository $userRepository,
        private VerificationTokenRepository $verificationTokenRepository,
        private LoginAttemptRepository $loginAttemptRepository,
        private EventDispatcher $eventDispatcher
    ) {
    }

    public function __invoke(UnlockAccount $command): void
    {
        $token = $this->verificationTokenRepository->getByToken(
            $command->token,
            TokenPurpose::UNLOCK_ACCOUNT
        );

        $user = $this->userRepository->getById($token->user->id);
        $user->unlockAccount();

        $this->userRepository->add($user);
        $this->verificationTokenRepository->remove($token);
        $this->loginAttemptRepository->deleteBy($user);
        $this->eventDispatcher->dispatch($user->releaseEvents());
    }
}
