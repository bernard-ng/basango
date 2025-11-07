<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\QueryHandler;

use Basango\FeedManagement\Application\ReadModel\BookmarkList;
use Basango\FeedManagement\Application\UseCase\Query\GetBookmarkList;
use Basango\SharedKernel\Application\Messaging\QueryHandler;

/**
 * Interface GetBookmarkListHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface GetBookmarkListHandler extends QueryHandler
{
    public function __invoke(GetBookmarkList $query): BookmarkList;
}
