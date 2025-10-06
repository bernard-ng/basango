<?php

declare(strict_types=1);

namespace Basango\FeedManagement\Infrastructure\Persistence\Doctrine\ORM;

use Basango\FeedManagement\Domain\Exception\CommentNotFound;
use Basango\FeedManagement\Domain\Model\Entity\Comment;
use Basango\FeedManagement\Domain\Model\Identity\CommentId;
use Basango\FeedManagement\Domain\Model\Repository\CommentRepository;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Class CommentOrmRepository.
 *
 * @extends ServiceEntityRepository<Comment>
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class CommentOrmRepository extends ServiceEntityRepository implements CommentRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Comment::class);
    }

    public function add(Comment $comment): void
    {
        $this->getEntityManager()->persist($comment);
        $this->getEntityManager()->flush();
    }

    public function remove(Comment $comment): void
    {
        $this->getEntityManager()->remove($comment);
        $this->getEntityManager()->flush();
    }

    public function getById(CommentId $commentId): Comment
    {
        $comment = $this->findOneBy([
            'id' => $commentId,
        ]);

        if (! $comment instanceof Comment) {
            throw CommentNotFound::withId($commentId);
        }

        return $comment;
    }
}
