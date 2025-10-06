<?php

declare(strict_types=1);

namespace Basango\Aggregator\Domain\Service\Scoring;

use Basango\Aggregator\Domain\Model\ValueObject\Scoring\Sentiment;

/**
 * Interface SentimentAnalyser.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface SentimentAnalyser
{
    public function analyse(string $content): Sentiment;
}
