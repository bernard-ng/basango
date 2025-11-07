<?php

declare(strict_types=1);

namespace Basango\Aggregator\Domain\Service\Scoring;

use Basango\Aggregator\Domain\Model\ValueObject\Scoring\Bias;
use Basango\Aggregator\Domain\Model\ValueObject\Scoring\Credibility;
use Basango\Aggregator\Domain\Model\ValueObject\Scoring\Reliability;
use Basango\Aggregator\Domain\Model\ValueObject\Scoring\Transparency;

/**
 * Interface CredibilityAnalyser.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface CredibilityAnalyser
{
    public function getBias(string $content): Bias;

    public function getTransparency(string $content): Transparency;

    public function getReliability(string $content): Reliability;

    public function analyse(string $content): Credibility;
}
