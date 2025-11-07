<?php

declare(strict_types=1);

namespace Basango\Aggregator\Domain\Model\ValueObject;

/**
 * Class TokenStatistics.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class TokenStatistics implements \JsonSerializable
{
    public ?int $total {
        get {
            return ($this->title ?? 0)
                + ($this->body ?? 0)
                + ($this->excerpt ?? 0)
                + ($this->categories ?? 0);
        }
    }

    public function __construct(
        public readonly ?int $title = null,
        public readonly ?int $body = null,
        public readonly ?int $excerpt = null,
        public readonly ?int $categories = null,
    ) {
    }

    public static function tryFrom(?string $value): ?self
    {
        if ($value === null) {
            return null;
        }

        try {
            $object = \json_decode($value, true, 512, JSON_THROW_ON_ERROR);

            return new self(
                $object['title'] ?? null,
                $object['body'] ?? null,
                $object['excerpt'] ?? null,
                $object['categories'] ?? null,
            );
        } catch (\Throwable) {
            return null;
        }
    }

    #[\Override]
    public function jsonSerialize(): array
    {
        return [
            'title' => $this->title,
            'body' => $this->body,
            'excerpt' => $this->excerpt,
            'categories' => $this->categories,
            'total' => $this->total,
        ];
    }
}
