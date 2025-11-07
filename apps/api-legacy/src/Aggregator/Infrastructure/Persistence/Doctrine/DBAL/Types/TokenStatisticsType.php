<?php

declare(strict_types=1);

namespace Basango\Aggregator\Infrastructure\Persistence\Doctrine\DBAL\Types;

use Basango\Aggregator\Domain\Model\ValueObject\TokenStatistics;
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\ConversionException;
use Doctrine\DBAL\Types\Type;

/**
 * Class TokenStatisticsType.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class TokenStatisticsType extends Type
{
    public function getSQLDeclaration(array $column, AbstractPlatform $platform): string
    {
        return $platform->getJsonTypeDeclarationSQL([
            'nullable' => true,
            'jsonb' => true,
        ]);
    }

    public function getName(): string
    {
        return 'token_statistics';
    }

    #[\Override]
    public function convertToPHPValue(mixed $value, AbstractPlatform $platform): ?TokenStatistics
    {
        if ($value === null) {
            return null;
        }

        if (! \is_string($value)) {
            throw ConversionException::conversionFailedInvalidType($value, $this->getName(), ['null', 'string', TokenStatistics::class]);
        }

        try {
            return TokenStatistics::tryFrom($value);
        } catch (\Throwable $e) {
            throw ConversionException::conversionFailed($value, $this->getName(), $e);
        }
    }

    #[\Override]
    public function convertToDatabaseValue($value, AbstractPlatform $platform): ?string
    {
        if ($value instanceof TokenStatistics) {
            return json_encode($value) ?: null;
        }

        if ($value === null || $value === '') {
            return null;
        }

        if (! \is_string($value)) {
            throw ConversionException::conversionFailedInvalidType($value, $this->getName(), ['null', 'string', TokenStatistics::class]);
        }

        throw ConversionException::conversionFailed($value, $this->getName());
    }
}
