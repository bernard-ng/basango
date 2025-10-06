<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Application\UseCase\QueryHandler;

use Basango\FeedManagement\Application\ReadModel\CommentList;
use Basango\FeedManagement\Application\UseCase\Query\GetArticleCommentList;
use Basango\SharedKernel\Application\Messaging\QueryHandler;

/**
 * Class GetArticleCommentListHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface GetArticleCommentListHandler extends QueryHandler
{
    public function __invoke(GetArticleCommentList $query): CommentList;
}
