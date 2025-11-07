<?php

declare(strict_types=1);

namespace Basango\SharedKernel\Domain\Model\Pagination;

use Basango\SharedKernel\Domain\DataTransfert\DataMapping;
use Symfony\Component\Uid\UuidV7;

/**
 * Class PaginationCursor.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class PaginationCursor
{
    public function __construct(
        public UuidV7 $id,
        public ?\DateTimeImmutable $date = null,
    ) {
    }

    /**
     * Creates a new PaginationCursor from a DateTimeImmutable and a UuidV7.
     * @throws \JsonException When JSON encoding fails
     */
    public static function encode(array $item, PaginatorKeyset $keyset): string
    {
        $payload = [
            'id' => DataMapping::string($item, $keyset->id),
        ];

        if ($keyset->date !== null) {
            $payload['date'] = DataMapping::dateTime($item, $keyset->date)->format('Y-m-d H:i:s');
        }

        return base64_encode(json_encode($payload, JSON_THROW_ON_ERROR));

    }

    /**
     * Decodes a cursor string into a PaginationCursor object.
     * Returns null if the cursor is invalid or cannot be decoded.
     */
    public static function decode(?string $cursor): ?self
    {
        if ($cursor === null) {
            return null;
        }

        try {
            $decoded = base64_decode($cursor, true);
            if ($decoded === false) {
                return null;
            }

            $data = json_decode($decoded, true, 512, JSON_THROW_ON_ERROR);

            if (! is_array($data) || ! isset($data['id'])) {
                throw new \InvalidArgumentException('Invalid cursor format');
            }

            $date = null;
            if (isset($data['date'])) {
                $date = new \DateTimeImmutable($data['date']);
            }

            return new self(
                id: UuidV7::fromString($data['id']),
                date: $date,
            );
        } catch (\Throwable) {
            return null;
        }
    }
}
