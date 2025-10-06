<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Domain\Exception;

use Basango\FeedManagement\Domain\Model\Identity\CommentId;
use Basango\SharedKernel\Domain\Exception\UserFacingError;

/**
 * Class BookmarkNotFound.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class CommentNotFound extends \DomainException implements UserFacingError
{
    public static function withId(CommentId $id): self
    {
        return new self(sprintf('Comment with id "%s" not found.', $id->toString()));
    }

    public function translationId(): string
    {
        return 'feed_management.exceptions.comment_not_found';
    }

    public function translationParameters(): array
    {
        return [];
    }

    public function translationDomain(): string
    {
        return 'feed_management';
    }
}
