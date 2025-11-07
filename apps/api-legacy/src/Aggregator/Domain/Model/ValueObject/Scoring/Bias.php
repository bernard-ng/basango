<?php

declare(strict_types=1);

namespace Basango\Aggregator\Domain\Model\ValueObject\Scoring;

/**
 * Class Bias.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
enum Bias: string
{
    case NEUTRAL = 'neutral';
    case SLIGHTLY = 'slightly';
    case PARTISAN = 'partisan';
    case EXTREME = 'extreme';
}
