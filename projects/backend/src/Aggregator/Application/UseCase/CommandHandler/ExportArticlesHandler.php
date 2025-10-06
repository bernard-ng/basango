<?php

declare(strict_types=1);

namespace Basango\Aggregator\Application\UseCase\CommandHandler;

use Basango\Aggregator\Application\ReadModel\ArticleForExport;
use Basango\Aggregator\Application\UseCase\Command\ExportArticles;
use Basango\Aggregator\Application\UseCase\Query\GetArticlesForExport;
use Basango\SharedKernel\Application\Messaging\CommandHandler;
use Basango\SharedKernel\Application\Messaging\QueryBus;
use Basango\SharedKernel\Domain\DataTransfert\DataExporter;
use Basango\SharedKernel\Domain\DataTransfert\TransfertSetting;

/**
 * Class GetArticlesForExportHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class ExportArticlesHandler implements CommandHandler
{
    public function __construct(
        private QueryBus $queryBus,
        private DataExporter $exporter,
        private string $projectDir
    ) {
    }

    public function __invoke(ExportArticles $command): void
    {
        $filename = sprintf(
            '%s/data/export-%s.csv',
            $this->projectDir,
            new \DateTimeImmutable('now')->format('U')
        );

        /** @var iterable<ArticleForExport> $articles */
        $articles = $this->queryBus->handle(new GetArticlesForExport($command->source, $command->date));

        $this->exporter->export($articles, new TransfertSetting($filename));
    }
}
