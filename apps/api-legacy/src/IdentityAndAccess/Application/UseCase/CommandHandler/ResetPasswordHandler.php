<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\UseCase\CommandHandler;

use Basango\IdentityAndAccess\Application\UseCase\Command\ResetPassword;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\IdentityAndAccess\Domain\Model\Repository\VerificationTokenRepository;
use Basango\IdentityAndAccess\Domain\Model\ValueObject\TokenPurpose;
use Basango\IdentityAndAccess\Domain\Service\PasswordHasher;
use Basango\SharedKernel\Application\Messaging\CommandHandler;
use Basango\SharedKernel\Domain\EventDispatcher\EventDispatcher;

/**
 * Class ResetPasswordHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class ResetPasswordHandler implements CommandHandler
{
    public function __construct(
        private UserRepository $userRepository,
        private VerificationTokenRepository $verificationTokenRepository,
        private PasswordHasher $passwordHasher,
        private EventDispatcher $eventDispatcher
    ) {
    }

    public function __invoke(ResetPassword $command): void
    {
        $token = $this->verificationTokenRepository->getByToken(
            $command->token,
            TokenPurpose::PASSWORD_RESET
        );

        $user = $this->userRepository->getById($token->user->id);
        $user->resetPassword($command->password, $this->passwordHasher);

        $this->userRepository->add($user);
        $this->verificationTokenRepository->remove($token);
        $this->eventDispatcher->dispatch($user->releaseEvents());
    }
}
