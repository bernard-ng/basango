<?php

declare(strict_types=1);

namespace Basango\IdentityAndAccess\Presentation\WriteModel;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Class RequestPasswordModel.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class RequestPasswordModel
{
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(max: 255)]
    public string $email;
}
