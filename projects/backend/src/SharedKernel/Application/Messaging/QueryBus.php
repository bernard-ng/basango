<?php

declare(strict_types=1);

namespace Basango\SharedKernel\Application\Messaging;

/**
 * Interface QueryBus.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface QueryBus
{
    public function handle(object $message): mixed;
}
