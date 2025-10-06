<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\ReadModel;

use Basango\Aggregator\Domain\Model\ValueObject\Scoring\Sentiment;
use Basango\FeedManagement\Domain\Model\Identity\CommentId;
use Basango\SharedKernel\Domain\DataTransfert\DataMapping;

/**
 * Class Comment.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class Comment
{
    public function __construct(
        public CommentId $id,
        public UserReference $user,
        public Sentiment $sentiment,
        public string $content,
        public \DateTimeImmutable $createdAt,
    ) {
    }

    public static function create(array $item): self
    {
        return new self(
            CommentId::fromBinary($item['comment_id']),
            UserReference::create($item),
            DataMapping::enum($item, 'comment_sentiment', Sentiment::class),
            DataMapping::string($item, 'comment_content'),
            DataMapping::dateTime($item, 'comment_created_at')
        );
    }
}
