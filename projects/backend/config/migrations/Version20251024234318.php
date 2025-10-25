<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Class Version20251024234318.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class Version20251024234318 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'add token statistics to article';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE article ADD token_statistics JSONB DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE article DROP token_statistics');
    }
}
