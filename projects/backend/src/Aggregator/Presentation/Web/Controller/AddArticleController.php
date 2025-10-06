<?php

declare(strict_types=1);

namespace Basango\Aggregator\Presentation\Web\Controller;

use Basango\Aggregator\Application\UseCase\Command\CreateArticle;
use Basango\Aggregator\Domain\Model\ValueObject\Link;
use Basango\Aggregator\Domain\Model\ValueObject\OpenGraph;
use Basango\Aggregator\Presentation\WriteModel\AddArticleModel;
use Basango\SharedKernel\Presentation\Web\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;

/**
 * Class AddArticleController.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class AddArticleController extends AbstractController
{
    public function __construct(
        #[Autowire(env: "BASANGO_CRAWLER_TOKEN")] private string $token
    ) {
    }

    #[Route(
        path: '/api/aggregator/articles',
        name: 'aggregator_add_article',
        requirements: [
            'token' => Requirement::ASCII_SLUG
        ],
        methods: ['POST']
    )]
    public function __invoke(
        #[MapQueryParameter] string $token, 
        #[MapRequestPayload] AddArticleModel $model
    ): JsonResponse {
        if ($token !== $this->token) {
            throw $this->createAccessDeniedException();
        }

        $this->handleCommand(new CreateArticle(
            $model->title,
            Link::from($model->link),
            join(', ', $model->categories),
            $model->body,
            $model->source,
            $model->timestamp,
            $model->metadata,
        ));


        return new JsonResponse(status: Response::HTTP_CREATED);
    }
}
