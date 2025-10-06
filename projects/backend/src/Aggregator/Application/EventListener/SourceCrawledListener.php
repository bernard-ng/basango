<?php

declare(strict_types=1);

namespace Basango\Aggregator\Application\EventListener;

use Basango\Aggregator\Application\Mailing\SourceCrawledEmail;
use Basango\Aggregator\Domain\Event\SourceCrawled;
use Basango\SharedKernel\Application\Mailing\Mailer;
use Basango\SharedKernel\Domain\EventListener\EventListener;
use Basango\SharedKernel\Domain\Model\ValueObject\EmailAddress;

/**
 * Class SourceFetchedListener.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class SourceCrawledListener implements EventListener
{
    public function __construct(
        private Mailer $mailer,
        private string $crawlingNotificationEmail
    ) {
    }

    public function __invoke(SourceCrawled $event): void
    {
        if ($event->notify) {
            $email = new SourceCrawledEmail(
                EmailAddress::from($this->crawlingNotificationEmail),
                $event->event,
                $event->source
            );

            $this->mailer->send($email);
        }
    }
}
