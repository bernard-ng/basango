<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\ReadModel;

use Basango\Aggregator\Domain\Model\Identity\SourceId;
use Basango\Aggregator\Domain\Model\ValueObject\Scoring\Bias;
use Basango\Aggregator\Domain\Model\ValueObject\Scoring\Credibility;
use Basango\Aggregator\Domain\Model\ValueObject\Scoring\Reliability;
use Basango\Aggregator\Domain\Model\ValueObject\Scoring\Transparency;
use Basango\SharedKernel\Domain\DataTransfert\DataMapping;

/**
 * Class SourceDetails.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class SourceDetails
{
    public function __construct(
        public SourceId $id,
        public string $name,
        public string $url,
        public Credibility $credibility,
        public PublicationGraph $publicationGraph,
        public CategoryShares $categoryShares,
        public int $articlesCount,
        public string $crawledAt,
        public ?string $displayName = null,
        public ?string $description = null,
        public ?string $updatedAt = null,
        public int $metadataAvailable = 0,
        public bool $followed = false,
        public ?string $image = null,
    ) {
    }

    public static function create(array $item, PublicationGraph $publicationGraph, CategoryShares $categoryShares): self
    {
        return new self(
            SourceId::fromString(DataMapping::string($item, 'source_id')),
            DataMapping::string($item, 'source_name'),
            DataMapping::string($item, 'source_url'),
            new Credibility(
                DataMapping::enum($item, 'source_bias', Bias::class),
                DataMapping::enum($item, 'source_reliability', Reliability::class),
                DataMapping::enum($item, 'source_transparency', Transparency::class)
            ),
            $publicationGraph,
            $categoryShares,
            DataMapping::integer($item, 'articles_count'),
            DataMapping::string($item, 'source_crawled_at'),
            DataMapping::nullableString($item, 'source_display_name'),
            DataMapping::nullableString($item, 'source_description'),
            DataMapping::nullableString($item, 'source_updated_at'),
            DataMapping::integer($item, 'articles_metadata_available'),
            DataMapping::boolean($item, 'source_is_followed'),
            DataMapping::nullableString($item, 'source_image'),
        );
    }
}
