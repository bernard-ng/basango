<?php

declare(strict_types=1);

namespace Basango\Aggregator\Application\UseCase\CommandHandler;

use Basango\Aggregator\Application\UseCase\Command\CreateSource;
use Basango\Aggregator\Domain\Model\Entity\Source;
use Basango\Aggregator\Domain\Model\Repository\SourceRepository;
use Basango\SharedKernel\Application\Messaging\CommandHandler;

/**
 * Class AddSourceHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class CreateSourceHandler implements CommandHandler
{
    public function __construct(
        private SourceRepository $sourceRepository
    ) {
    }

    public function __invoke(CreateSource $command): void
    {
        $source = Source::create($command->name, sprintf('https://%s', $command->name))
            ->defineCredibility($command->credibility)
            ->defineProfileInfos($command->displayName, $command->description);

        $this->sourceRepository->add($source);
    }
}
