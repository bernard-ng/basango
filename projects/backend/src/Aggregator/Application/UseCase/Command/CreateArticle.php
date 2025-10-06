<?php

declare(strict_types=1);

namespace Basango\Aggregator\Application\UseCase\Command;

use Basango\Aggregator\Domain\Model\ValueObject\Link;
use Basango\Aggregator\Domain\Model\ValueObject\OpenGraph;

/**
 * Class Save.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class CreateArticle
{
    public function __construct(
        public string $title,
        public Link $link,
        public string $categories,
        public string $body,
        public string $source,
        public int $timestamp,
        public ?OpenGraph $metadata = null
    ) {
    }
}
