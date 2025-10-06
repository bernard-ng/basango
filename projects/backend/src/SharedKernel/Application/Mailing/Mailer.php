<?php

declare(strict_types=1);

namespace Basango\SharedKernel\Application\Mailing;

/**
 * Interface Mailer.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface Mailer
{
    public function send(EmailDefinition $email): void;
}
