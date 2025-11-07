<?php

declare(strict_types=1);

namespace Basango\SharedKernel\Infrastructure\Framework\Symfony\Messaging;

use Basango\SharedKernel\Application\Messaging\AsyncMessage;
use Basango\SharedKernel\Application\Messaging\MessageBus;
use Symfony\Component\Messenger\Exception\ExceptionInterface;
use Symfony\Component\Messenger\MessageBusInterface;

/**
 * Class MessengerMessageBus.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class MessengerMessageBus implements MessageBus
{
    public function __construct(
        private MessageBusInterface $messageBus
    ) {
    }

    /**
     * @throws ExceptionInterface
     */
    #[\Override]
    public function dispatch(AsyncMessage $message): void
    {
        $this->messageBus->dispatch($message);
    }
}
