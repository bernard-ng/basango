<?php

declare(strict_types=1);

namespace Basango\Aggregator\Application\UseCase\QueryHandler;

use Basango\Aggregator\Application\ReadModel\ArticleForExport;
use Basango\Aggregator\Application\UseCase\Query\GetArticlesForExport;
use Basango\SharedKernel\Application\Messaging\QueryHandler;

/**
 * Class GetArticlesForExportHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface GetArticlesForExportHandler extends QueryHandler
{
    /**
     * @return iterable<ArticleForExport>
     */
    public function __invoke(GetArticlesForExport $query): iterable;
}
