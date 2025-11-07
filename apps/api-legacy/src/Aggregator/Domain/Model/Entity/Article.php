<?php

declare(strict_types=1);

namespace Basango\Aggregator\Domain\Model\Entity;

use Basango\Aggregator\Domain\Model\Identity\ArticleId;
use Basango\Aggregator\Domain\Model\ValueObject\Link;
use Basango\Aggregator\Domain\Model\ValueObject\OpenGraph;
use Basango\Aggregator\Domain\Model\ValueObject\ReadingTime;
use Basango\Aggregator\Domain\Model\ValueObject\Scoring\Credibility;
use Basango\Aggregator\Domain\Model\ValueObject\Scoring\Sentiment;
use Basango\Aggregator\Domain\Model\ValueObject\TokenStatistics;

/**
 * Class Article.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
class Article
{
    public readonly ArticleId $id;

    public function __construct(
        public readonly string $title,
        public readonly Link $link,
        public readonly string $body,
        public readonly string $hash,
        private(set) array $categories,
        public readonly Source $source,
        public readonly \DateTimeImmutable $publishedAt,
        public readonly \DateTimeImmutable $crawledAt = new \DateTimeImmutable(),
        private(set) Credibility $credibility = new Credibility(),
        private(set) Sentiment $sentiment = Sentiment::NEUTRAL,
        private(set) ?OpenGraph $metadata = null,
        private(set) ?TokenStatistics $tokenStatistics = null,
        private(set) ?ReadingTime $readingTime = null,
        private(set) ?\DateTimeImmutable $updatedAt = null,
        public readonly ?string $image = null,
        public readonly ?string $excerpt = null,
    ) {
        $this->id = new ArticleId();
    }

    public function defineCredibility(Credibility $credibility): self
    {
        $this->credibility = $credibility;
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function defineSentiment(Sentiment $sentiment): self
    {
        $this->sentiment = $sentiment;
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function assignCategories(array $categories): self
    {
        $this->categories = $categories;
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function computeReadingTime(): self
    {
        $this->readingTime = ReadingTime::fromContent($this->body);
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function defineOpenGraph(?OpenGraph $object): self
    {
        $this->metadata = new OpenGraph(
            title: $object?->title,
            description: $object?->description,
            image: $object?->image,
            locale: $object->locale ?? 'fr'
        );

        return $this;
    }

    public function defineTokenStatistics(?TokenStatistics $statistics): self
    {
        $this->tokenStatistics = $statistics;

        return $this;
    }
}
