<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\QueryHandler;

use Basango\FeedManagement\Application\ReadModel\ArticleDetails;
use Basango\FeedManagement\Application\UseCase\Query\GetArticleDetails;
use Basango\SharedKernel\Application\Messaging\QueryHandler;

/**
 * Class GetArticleDetailsDbalHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface GetArticleDetailsHandler extends QueryHandler
{
    public function __invoke(GetArticleDetails $query): ArticleDetails;
}
