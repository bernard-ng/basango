<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\UseCase\CommandHandler;

use Basango\IdentityAndAccess\Application\UseCase\Command\LockAccount;
use Basango\IdentityAndAccess\Domain\Model\Entity\User;
use Basango\IdentityAndAccess\Domain\Model\Entity\VerificationToken;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\IdentityAndAccess\Domain\Model\Repository\VerificationTokenRepository;
use Basango\IdentityAndAccess\Domain\Model\ValueObject\TokenPurpose;
use Basango\IdentityAndAccess\Domain\Service\SecretGenerator;
use Basango\SharedKernel\Application\Messaging\CommandHandler;
use Basango\SharedKernel\Domain\EventDispatcher\EventDispatcher;

/**
 * Class ResetPasswordHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class LockAccountHandler implements CommandHandler
{
    public function __construct(
        private UserRepository $userRepository,
        private VerificationTokenRepository $verificationTokenRepository,
        private SecretGenerator $secretGenerator,
        private EventDispatcher $eventDispatcher
    ) {
    }

    public function __invoke(LockAccount $command): void
    {
        $user = $this->userRepository->getById($command->userId);
        $token = $this->createVerificationToken($user);
        $user->lockAccount($token);

        $this->userRepository->add($user);
        $this->verificationTokenRepository->add($token);
        $this->eventDispatcher->dispatch($user->releaseEvents());
    }

    private function createVerificationToken(User $user): VerificationToken
    {
        $secret = $this->secretGenerator->generateToken();
        return VerificationToken::create($user, $secret, TokenPurpose::UNLOCK_ACCOUNT);
    }
}
