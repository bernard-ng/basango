<?php

declare(strict_types=1);

namespace Basango\Aggregator\Domain\Exception;

use Basango\Aggregator\Domain\Model\ValueObject\Link;
use Basango\SharedKernel\Domain\Exception\UserFacingError;

/**
 * Class DuplicatedArticle.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class DuplicatedArticle extends \DomainException implements UserFacingError
{
    public static function withLink(Link $link): self
    {
        return new self(sprintf('duplicate article with %s link', (string) $link));
    }

    public function translationId(): string
    {
        return 'aggregator.exceptions.duplicate_article';
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
