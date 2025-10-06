<?php

declare(strict_types=1);

namespace Basango\Aggregator\Domain\Exception;

use Basango\SharedKernel\Domain\Exception\UserFacingError;

/**
 * Class DuplicatedArticle.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class DuplicatedSource extends \DomainException implements UserFacingError
{
    public static function withName(string $name): self
    {
        return new self(sprintf('duplicate source with %s name', $name));
    }

    public function translationId(): string
    {
        return 'aggregator.exceptions.duplicate_source';
    }

    public function translationParameters(): array
    {
        return [];
    }

    public function translationDomain(): string
    {
        return 'aggregator';
    }
}
