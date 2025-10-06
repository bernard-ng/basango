<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Domain\Model\Entity;

use Basango\IdentityAndAccess\Domain\Event\AccountConfirmed;
use Basango\IdentityAndAccess\Domain\Event\AccountLocked;
use Basango\IdentityAndAccess\Domain\Event\AccountUnlocked;
use Basango\IdentityAndAccess\Domain\Event\ConfirmationRequested;
use Basango\IdentityAndAccess\Domain\Event\EmailUpdated;
use Basango\IdentityAndAccess\Domain\Event\PasswordCreated;
use Basango\IdentityAndAccess\Domain\Event\PasswordForgotten;
use Basango\IdentityAndAccess\Domain\Event\PasswordReset;
use Basango\IdentityAndAccess\Domain\Event\PasswordUpdated;
use Basango\IdentityAndAccess\Domain\Exception\InvalidCurrentPassword;
use Basango\IdentityAndAccess\Domain\Exception\PasswordAlreadyDefined;
use Basango\IdentityAndAccess\Domain\Model\Identity\UserId;
use Basango\IdentityAndAccess\Domain\Model\ValueObject\Roles;
use Basango\IdentityAndAccess\Domain\Model\ValueObject\Secret\GeneratedCode;
use Basango\IdentityAndAccess\Domain\Service\PasswordHasher;
use Basango\SharedKernel\Domain\EventDispatcher\EventEmitterTrait;
use Basango\SharedKernel\Domain\Model\ValueObject\EmailAddress;

/**
 * Class User.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
class User
{
    use EventEmitterTrait;

    public readonly UserId $id;

    private function __construct(
        private(set) string $name,
        private(set) EmailAddress $email,
        private(set) Roles $roles,
        private(set) ?string $password = null,
        private(set) bool $isLocked = false,
        private(set) bool $isConfirmed = false,
        private(set) ?\DateTimeImmutable $updatedAt = null,
        public readonly ?\DateTimeImmutable $createdAt = new \DateTimeImmutable(),
    ) {
        $this->id = new UserId();
    }

    public function lockAccount(VerificationToken $verificationToken): self
    {
        $this->isLocked = true;
        $this->emitEvent(new AccountLocked($this->id, $verificationToken->token));

        return $this;
    }

    public function unlockAccount(): self
    {
        $this->isLocked = false;
        $this->emitEvent(new AccountUnlocked($this->id));

        return $this;
    }

    public function confirmAccount(): self
    {
        $this->isConfirmed = true;
        $this->emitEvent(new AccountConfirmed($this->id));

        return $this;
    }

    public static function register(string $name, EmailAddress $email, ?Roles $roles): self
    {
        return new self($name, $email, $roles ?? Roles::user());
    }

    public function updateProfile(string $name, Roles $roles): static
    {
        $this->name = $name;
        $this->roles = $roles;
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function updateEmail(EmailAddress $email): self
    {
        $previous = $this->email;
        $this->email = $email;
        $this->emitEvent(new EmailUpdated($this->id, $previous, $email));

        return $this;
    }

    public function resetPassword(string $password, PasswordHasher $passwordHasher): void
    {
        $this->password = $passwordHasher->hash($this, $password);
        $this->emitEvent(new PasswordReset($this->id));
    }

    public function updatePassword(string $current, string $new, PasswordHasher $passwordHasher): self
    {
        if ($this->password === null || ! $passwordHasher->verify($this, $current)) {
            throw new InvalidCurrentPassword();
        }

        $this->password = $passwordHasher->hash($this, $new);
        $this->emitEvent(new PasswordUpdated($this->id));

        return $this;
    }

    public function definePassword(GeneratedCode|string $password, PasswordHasher $passwordHasher): self
    {
        if ($this->password !== null) {
            throw new PasswordAlreadyDefined();
        }

        $this->password = $passwordHasher->hash($this, (string) $password);
        $this->updatedAt = new \DateTimeImmutable();

        if ($password instanceof GeneratedCode) {
            $this->emitEvent(new PasswordCreated($this->id, $password));
        }

        return $this;
    }

    public function requestPasswordReset(VerificationToken $verificationToken): self
    {
        $this->emitEvent(new PasswordForgotten($this->id, $verificationToken->token));

        return $this;
    }

    public function requestAccountConfirmation(VerificationToken $verificationToken): self
    {
        $this->emitEvent(new ConfirmationRequested($this->id, $verificationToken->token));

        return $this;
    }
}
