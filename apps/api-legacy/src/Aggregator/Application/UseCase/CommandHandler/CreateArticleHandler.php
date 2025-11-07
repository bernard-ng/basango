<?php

declare(strict_types=1);

namespace Basango\Aggregator\Application\UseCase\CommandHandler;

use Basango\Aggregator\Application\UseCase\Command\CreateArticle;
use Basango\Aggregator\Domain\Exception\DuplicatedArticle;
use Basango\Aggregator\Domain\Model\Entity\Article;
use Basango\Aggregator\Domain\Model\Repository\ArticleRepository;
use Basango\Aggregator\Domain\Model\Repository\SourceRepository;
use Basango\Aggregator\Domain\Service\HashCalculator;
use Basango\SharedKernel\Application\Messaging\CommandHandler;

/**
 * Class CreateArticlesHandler.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final readonly class CreateArticleHandler implements CommandHandler
{
    public function __construct(
        private SourceRepository $sourceRepository,
        private ArticleRepository $articleRepository,
        private HashCalculator $hashCalculator
    ) {
    }

    public function __invoke(CreateArticle $command): void
    {
        $hash = $this->hashCalculator->calculate((string) $command->link);
        $article = $this->articleRepository->getByHash($hash);
        if ($article instanceof Article) {
            throw DuplicatedArticle::withLink($command->link);
        }

        /** @var \DateTimeImmutable $publishedAt */
        $publishedAt = \DateTimeImmutable::createFromFormat('U', (string) $command->timestamp);
        $source = $this->sourceRepository->getByName($command->source);

        $article = new Article(
            title: $command->title,
            link: $command->link,
            body: $command->body,
            hash: $hash,
            categories: $command->categories,
            source: $source,
            publishedAt: $publishedAt
        );
        $article
            ->defineOpenGraph($command->metadata)
            ->defineTokenStatistics($command->tokenStatistics)
            ->computeReadingTime();

        $this->articleRepository->add($article);
    }
}
