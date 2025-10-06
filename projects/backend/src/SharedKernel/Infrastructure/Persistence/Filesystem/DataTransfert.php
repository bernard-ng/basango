<?php

declare(strict_types=1);

namespace Basango\SharedKernel\Infrastructure\Persistence\Filesystem;

use Basango\SharedKernel\Domain\Assert;
use Basango\SharedKernel\Domain\DataTransfert\DataExporter;
use Basango\SharedKernel\Domain\DataTransfert\DataImporter;
use Basango\SharedKernel\Domain\DataTransfert\TransfertSetting;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * Class DataTransfert.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class DataTransfert implements DataImporter, DataExporter
{
    private const array SUPPORTED_FORMATS = ['csv'];

    public function __construct(
        private SerializerInterface $serializer,
        private Filesystem $filesystem,
    ) {
    }

    #[\Override]
    public function export(iterable $data, TransfertSetting $setting = new TransfertSetting()): \SplFileObject
    {
        Assert::oneOf($setting->format, self::SUPPORTED_FORMATS);

        $data = $this->serializer->serialize($data, $setting->format);
        $filename = $setting->filename ?? $this->filesystem->tempnam(sys_get_temp_dir(), 'export');
        $this->filesystem->dumpFile($filename, $data);

        return new \SplFileObject($filename);
    }

    #[\Override]
    public function import(\SplFileObject $file, TransfertSetting $setting = new TransfertSetting()): iterable
    {
        Assert::notNull($setting->type);
        Assert::oneOf($setting->format, self::SUPPORTED_FORMATS);

        $data = $this->filesystem->readFile($file->getPathname());

        return $this->serializer->deserialize($data, $setting->type, $setting->format);
    }
}
