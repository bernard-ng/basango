<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Application\UseCase\CommandHandler;

use Basango\IdentityAndAccess\Application\UseCase\Command\RequestPassword;
use Basango\IdentityAndAccess\Domain\Exception\UserNotFound;
use Basango\IdentityAndAccess\Domain\Model\Entity\User;
use Basango\IdentityAndAccess\Domain\Model\Entity\VerificationToken;
use Basango\IdentityAndAccess\Domain\Model\Repository\UserRepository;
use Basango\IdentityAndAccess\Domain\Model\Repository\VerificationTokenRepository;
use Basango\IdentityAndAccess\Domain\Model\ValueObject\TokenPurpose;
use Basango\IdentityAndAccess\Domain\Service\SecretGenerator;
use Basango\SharedKernel\Application\Messaging\CommandHandler;
use Basango\SharedKernel\Domain\EventDispatcher\EventDispatcher;

/**
 * Class RequestPasswordHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class RequestPasswordHandler implements CommandHandler
{
    public function __construct(
        private UserRepository $userRepository,
        private VerificationTokenRepository $verificationTokenRepository,
        private SecretGenerator $secretGenerator,
        private EventDispatcher $eventDispatcher,
    ) {
    }

    public function __invoke(RequestPassword $command): void
    {
        $user = $this->userRepository->getByEmail($command->email);
        if (! $user instanceof User) {
            throw UserNotFound::withEmail($command->email);
        }

        $token = $this->createVerificationToken($user);
        $user->requestPasswordReset($token);

        $this->userRepository->add($user);
        $this->verificationTokenRepository->add($token);
        $this->eventDispatcher->dispatch($user->releaseEvents());
    }

    private function createVerificationToken(User $user): VerificationToken
    {
        $secret = $this->secretGenerator->generateToken();
        return VerificationToken::create($user, $secret, TokenPurpose::PASSWORD_RESET);
    }
}
