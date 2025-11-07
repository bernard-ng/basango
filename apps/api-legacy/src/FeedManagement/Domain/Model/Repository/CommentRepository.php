<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Domain\Model\Repository;

use Basango\FeedManagement\Domain\Model\Entity\Comment;
use Basango\FeedManagement\Domain\Model\Identity\CommentId;

/**
 * Interface CommentRepository.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
interface CommentRepository
{
    public function add(Comment $comment): void;

    public function remove(Comment $comment): void;

    public function getById(CommentId $commentId): Comment;
}
