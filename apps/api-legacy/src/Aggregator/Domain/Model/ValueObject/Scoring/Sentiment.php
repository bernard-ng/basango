<?php

declare(strict_types=1);

namespace Basango\Aggregator\Domain\Model\ValueObject\Scoring;

/**
 * Enum Sentiment.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
enum Sentiment: string
{
    case NEGATIVE = 'negative';
    case POSITIVE = 'positive';
    case NEUTRAL = 'neutral';
}
