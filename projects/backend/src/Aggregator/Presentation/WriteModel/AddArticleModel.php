<?php

declare(strict_types=1);

namespace Basango\Aggregator\Presentation\WriteModel;

use Basango\Aggregator\Domain\Model\ValueObject\OpenGraph;
use Basango\Aggregator\Domain\Model\ValueObject\TokenStatistics;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Class AddArticleModel.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class AddArticleModel
{
    #[Assert\NotBlank]
    public string $title;

    #[Assert\NotBlank]
    public string $link;

    #[Assert\NotBlank]
    public string $body;

    #[Assert\NotBlank]
    public string $source;

    #[Assert\NotBlank]
    public int $timestamp;

    public array $categories = [];

    public ?OpenGraph $metadata = null;

    public ?TokenStatistics $tokenStatistics = null;
}
