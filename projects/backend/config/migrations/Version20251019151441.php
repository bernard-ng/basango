<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;
use Doctrine\Migrations\Exception\IrreversibleMigration;

/**
 * Class Version20251019151441.
 *
 * @author bernard-ng <bernard@devscast.tech>
 */
final class Version20251019151441 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'initial postgresql schema';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE EXTENSION IF NOT EXISTS pg_trgm;"); // for trigram indexes (links, titles, etc.)
        $this->addSql("SET SESSION TIME ZONE 'UTC';");

        // -- ---------- TABLE: article ----------
        $this->addSql(<<<SQL
            CREATE TABLE article (
                id UUID NOT NULL,
                source_id UUID NOT NULL, 
                title VARCHAR(1024) NOT NULL, 
                body TEXT NOT NULL, 
                hash VARCHAR(32) NOT NULL, 
                categories TEXT[] DEFAULT NULL, 
                sentiment VARCHAR(30) DEFAULT 'neutral' NOT NULL, 
                metadata JSONB DEFAULT NULL, 
                image VARCHAR(1024) GENERATED ALWAYS AS ((metadata->>'image')) STORED, 
                excerpt VARCHAR(255) GENERATED ALWAYS AS ((LEFT(body, 200) || '...')) STORED, 
                published_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, 
                crawled_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, 
                updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, 
                link VARCHAR(1024) NOT NULL, 
                bias VARCHAR(30) DEFAULT 'neutral' NOT NULL, 
                reliability VARCHAR(30) DEFAULT 'reliable' NOT NULL, 
                transparency VARCHAR(30) DEFAULT 'medium' NOT NULL, 
                reading_time INT DEFAULT 1,
                CONSTRAINT CHK_ARTICLE_READING_TIME CHECK (reading_time >= 0),
                CONSTRAINT CHK_ARTICLE_SENTIMENT CHECK (sentiment IN ('positive','neutral','negative')),
                CONSTRAINT CHK_ARTICLE_METADATA_JSON CHECK (metadata IS NULL OR JSONB_TYPEOF(metadata) IN ('object','array')),
                PRIMARY KEY (id)
            )
        SQL
        );
        $this->addSql('CREATE INDEX IDX_23A0E66953C1C61 ON article (source_id)');
        $this->addSql('CREATE INDEX IDX_ARTICLE_PUBLISHED_AT ON article (published_at DESC)');
        $this->addSql('CREATE INDEX IDX_ARTICLE_PUBLISHED_ID ON article (published_at DESC, id DESC)');
        $this->addSql('CREATE UNIQUE INDEX UNQ_ARTICLE_HASH ON article (hash)');
        $this->addSql(<<<SQL
            ALTER TABLE article ADD COLUMN tsv TSVECTOR GENERATED ALWAYS AS (
                SETWEIGHT(TO_TSVECTOR('french', COALESCE(title,'')), 'A') ||
                SETWEIGHT(TO_TSVECTOR('french', COALESCE(body ,'')), 'B')
            ) STORED;
        SQL
        );
        $this->addSql('CREATE INDEX GIN_ARTICLE_TSV ON article USING GIN(tsv)');
        $this->addSql('CREATE INDEX GIN_ARTICLE_LINK_TRGM ON article USING GIN (link gin_trgm_ops)');
        $this->addSql('CREATE INDEX GIN_ARTICLE_TITLE_TRGM ON article USING GIN (title gin_trgm_ops)');
        $this->addSql('CREATE INDEX GIN_ARTICLE_CATEGORIES ON article USING GIN (categories)');
        $this->addSql("COMMENT ON COLUMN article.id IS '(DC2Type:article_id)';");
        $this->addSql("COMMENT ON COLUMN article.source_id IS '(DC2Type:source_id)';");
        $this->addSql("COMMENT ON COLUMN article.published_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN article.crawled_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN article.updated_at IS '(DC2Type:datetime_immutable)'");

        // -- ---------- TABLE: bookmark ----------
        $this->addSql(<<<SQL
            CREATE TABLE bookmark (
                id UUID NOT NULL, 
                user_id UUID NOT NULL, 
                name VARCHAR(255) NOT NULL, 
                description VARCHAR(512) DEFAULT NULL, 
                is_public BOOLEAN DEFAULT false NOT NULL, 
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, 
                updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, 
                PRIMARY KEY(id)
            )
        SQL
        );
        $this->addSql('CREATE INDEX IDX_DA62921DA76ED395 ON bookmark (user_id)');
        $this->addSql('CREATE INDEX IDX_BOOKMARK_USER_CREATED ON bookmark (user_id, created_at DESC)');
        $this->addSql("COMMENT ON COLUMN bookmark.id IS '(DC2Type:bookmark_id)'");
        $this->addSql("COMMENT ON COLUMN bookmark.user_id IS '(DC2Type:user_id)'");
        $this->addSql("COMMENT ON COLUMN bookmark.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN bookmark.updated_at IS '(DC2Type:datetime_immutable)'");

        // -- ---------- TABLE: bookmark_article ----------
        $this->addSql(<<<SQL
            CREATE TABLE bookmark_article (
                bookmark_id UUID NOT NULL, 
                article_id UUID NOT NULL, 
                PRIMARY KEY(bookmark_id, article_id)
            )
        SQL
        );
        $this->addSql('CREATE INDEX IDX_6FE2655D92741D25 ON bookmark_article (bookmark_id)');
        $this->addSql('CREATE INDEX IDX_6FE2655D7294869C ON bookmark_article (article_id)');
        $this->addSql("COMMENT ON COLUMN bookmark_article.bookmark_id IS '(DC2Type:bookmark_id)'");
        $this->addSql("COMMENT ON COLUMN bookmark_article.article_id IS '(DC2Type:article_id)'");

        // -- ---------- TABLE: comment ----------
        $this->addSql(<<<SQL
            CREATE TABLE comment (
                id UUID NOT NULL, 
                user_id UUID NOT NULL, 
                article_id UUID NOT NULL, 
                content VARCHAR(512) NOT NULL, 
                sentiment VARCHAR(30) DEFAULT 'neutral' NOT NULL, 
                is_spam BOOLEAN DEFAULT false NOT NULL, 
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, 
                PRIMARY KEY(id)
            )
        SQL
        );
        $this->addSql('CREATE INDEX IDX_9474526CA76ED395 ON comment (user_id)');
        $this->addSql('CREATE INDEX IDX_9474526C7294869C ON comment (article_id)');
        $this->addSql('CREATE INDEX IDX_COMMENT_ARTICLE_CREATED ON comment (article_id, created_at DESC)');
        $this->addSql("COMMENT ON COLUMN comment.id IS '(DC2Type:comment_id)'");
        $this->addSql("COMMENT ON COLUMN comment.user_id IS '(DC2Type:user_id)'");
        $this->addSql("COMMENT ON COLUMN comment.article_id IS '(DC2Type:article_id)'");
        $this->addSql("COMMENT ON COLUMN comment.created_at IS '(DC2Type:datetime_immutable)'");

        // -- ---------- TABLE: followed_source ----------
        $this->addSql(<<<SQL
            CREATE TABLE followed_source (
                id UUID NOT NULL, 
                follower_id UUID NOT NULL, 
                source_id UUID NOT NULL, 
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, 
                PRIMARY KEY(id)
            )
        SQL
        );
        $this->addSql('CREATE INDEX IDX_7A763A3EAC24F853 ON followed_source (follower_id)');
        $this->addSql('CREATE INDEX IDX_7A763A3E953C1C61 ON followed_source (source_id)');
        $this->addSql('CREATE INDEX IDX_FOLLOWED_SOURCE_FOLLOWER_CREATED ON followed_source (follower_id, created_at DESC)');
        $this->addSql("COMMENT ON COLUMN followed_source.id IS '(DC2Type:followed_source_id)'");
        $this->addSql("COMMENT ON COLUMN followed_source.follower_id IS '(DC2Type:user_id)'");
        $this->addSql("COMMENT ON COLUMN followed_source.source_id IS '(DC2Type:source_id)'");
        $this->addSql("COMMENT ON COLUMN followed_source.created_at IS '(DC2Type:datetime_immutable)'");

        // -- ---------- TABLE: login_attempt ----------
        $this->addSql(<<<SQL
            CREATE TABLE login_attempt (
                id UUID NOT NULL, 
                user_id UUID NOT NULL, 
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, 
                PRIMARY KEY(id)
            )
        SQL
        );
        $this->addSql('CREATE INDEX IDX_8C11C1BA76ED395 ON login_attempt (user_id)');
        $this->addSql('CREATE INDEX IDX_LOGIN_ATTEMPT_CREATED_AT ON login_attempt (created_at DESC)');
        $this->addSql("COMMENT ON COLUMN login_attempt.id IS '(DC2Type:login_attempt_id)'");
        $this->addSql("COMMENT ON COLUMN login_attempt.user_id IS '(DC2Type:user_id)'");
        $this->addSql("COMMENT ON COLUMN login_attempt.created_at IS '(DC2Type:datetime_immutable)'");

        // -- ---------- TABLE: login_history ----------
        $this->addSql(<<<SQL
            CREATE TABLE login_history (
                id UUID NOT NULL, 
                user_id UUID NOT NULL, 
                ip_address INET DEFAULT NULL, 
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, 
                device_operating_system VARCHAR(255) DEFAULT NULL, 
                device_client VARCHAR(255) DEFAULT NULL, 
                device_device VARCHAR(255) DEFAULT NULL, 
                device_is_bot BOOLEAN DEFAULT false NOT NULL, 
                location_time_zone VARCHAR(255) DEFAULT NULL, 
                location_longitude DOUBLE PRECISION DEFAULT NULL, 
                location_latitude DOUBLE PRECISION DEFAULT NULL, 
                location_accuracy_radius INT DEFAULT NULL, 
                PRIMARY KEY(id)
            )
        SQL
        );
        $this->addSql('CREATE INDEX IDX_37976E36A76ED395 ON login_history (user_id)');
        $this->addSql('CREATE INDEX IDX_LOGIN_HISTORY_CREATED_AT ON login_history (user_id, created_at DESC)');
        $this->addSql('CREATE INDEX IDX_LOGIN_HISTORY_IP_ADDRESS ON login_history (ip_address)');
        $this->addSql("COMMENT ON COLUMN login_history.id IS '(DC2Type:login_history_id)'");
        $this->addSql("COMMENT ON COLUMN login_history.user_id IS '(DC2Type:user_id)'");
        $this->addSql("COMMENT ON COLUMN login_history.created_at IS '(DC2Type:datetime_immutable)'");

        // -- ---------- TABLE: refresh_tokens ----------
        $this->addSql('CREATE SEQUENCE refresh_tokens_id_seq INCREMENT BY 1 MINVALUE 1 START 1');
        $this->addSql(<<<SQL
            CREATE TABLE refresh_tokens (
                id INT NOT NULL, 
                refresh_token VARCHAR(128) NOT NULL, 
                username VARCHAR(255) NOT NULL, 
                valid TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id)
            )
        SQL
        );
        $this->addSql('CREATE UNIQUE INDEX UNIQ_9BACE7E1C74F2195 ON refresh_tokens (refresh_token)');

        // -- ---------- TABLE: source ----------
        $this->addSql(<<<SQL
            CREATE TABLE source (
                id UUID NOT NULL, 
                url VARCHAR(255) NOT NULL, 
                name VARCHAR(255) NOT NULL, 
                display_name VARCHAR(255) DEFAULT NULL, 
                description VARCHAR(1024) DEFAULT NULL, 
                updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, 
                bias VARCHAR(30) DEFAULT 'neutral' NOT NULL, 
                reliability VARCHAR(30) DEFAULT 'reliable' NOT NULL, 
                transparency VARCHAR(30) DEFAULT 'medium' NOT NULL, 
                PRIMARY KEY(id)
            )
        SQL
        );
        $this->addSql('CREATE UNIQUE INDEX UNQ_SOURCE_NAME ON source (LOWER(name))');
        $this->addSql('CREATE UNIQUE INDEX UNQ_SOURCE_URL ON source (LOWER(url))');
        $this->addSql("COMMENT ON COLUMN source.id IS '(DC2Type:source_id)'");
        $this->addSql("COMMENT ON COLUMN source.updated_at IS '(DC2Type:datetime_immutable)'");

        // -- ---------- TABLE: user ----------
        $this->addSql(<<<SQL
            CREATE TABLE "user" (
                id UUID NOT NULL, 
                name VARCHAR(255) NOT NULL, 
                email VARCHAR(255) NOT NULL, 
                password VARCHAR(512) NOT NULL, 
                is_locked BOOLEAN DEFAULT false NOT NULL, 
                is_confirmed BOOLEAN DEFAULT false NOT NULL, 
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, 
                updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, 
                roles JSONB NOT NULL, 
                PRIMARY KEY(id),
                CONSTRAINT CHK_USER_ROLES_JSON CHECK (JSONB_TYPEOF(roles) = 'array')
            )
        SQL
        );
        $this->addSql(<<<SQL
            CREATE UNIQUE INDEX UNQ_USER_EMAIL ON "user" (LOWER(email));
        SQL
        );
        $this->addSql("COMMENT ON COLUMN \"user\".id IS '(DC2Type:user_id)'");
        $this->addSql("COMMENT ON COLUMN \"user\".created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN \"user\".updated_at IS '(DC2Type:datetime_immutable)'");

        // -- ---------- TABLE: verification_token ----------
        $this->addSql(<<<SQL
            CREATE TABLE verification_token (
                id UUID NOT NULL, 
                user_id UUID NOT NULL, 
                purpose VARCHAR(255) NOT NULL, 
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, 
                token VARCHAR(60) DEFAULT NULL, 
                PRIMARY KEY(id)
            )
        SQL
        );
        $this->addSql('CREATE INDEX IDX_C1CC006BA76ED395 ON verification_token (user_id)');
        $this->addSql('CREATE INDEX IDX_VERIF_TOKEN_CREATED_AT ON verification_token (created_at DESC)');
        $this->addSql('CREATE UNIQUE INDEX UNQ_VERIF_USER_PURPOSE_TOKEN ON verification_token (user_id, purpose) WHERE token IS NOT NULL');
        $this->addSql("COMMENT ON COLUMN verification_token.id IS '(DC2Type:verification_token_id)'");
        $this->addSql("COMMENT ON COLUMN verification_token.user_id IS '(DC2Type:user_id)'");
        $this->addSql("COMMENT ON COLUMN verification_token.created_at IS '(DC2Type:datetime_immutable)'");

        // -- ---------- FOREIGN KEY CONSTRAINTS ----------
        $this->addSql('ALTER TABLE article ADD CONSTRAINT FK_23A0E66953C1C61 FOREIGN KEY (source_id) REFERENCES source (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE bookmark ADD CONSTRAINT FK_DA62921DA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE bookmark_article ADD CONSTRAINT FK_6FE2655D92741D25 FOREIGN KEY (bookmark_id) REFERENCES bookmark (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE bookmark_article ADD CONSTRAINT FK_6FE2655D7294869C FOREIGN KEY (article_id) REFERENCES article (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE comment ADD CONSTRAINT FK_9474526CA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE comment ADD CONSTRAINT FK_9474526C7294869C FOREIGN KEY (article_id) REFERENCES article (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE followed_source ADD CONSTRAINT FK_7A763A3EAC24F853 FOREIGN KEY (follower_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE followed_source ADD CONSTRAINT FK_7A763A3E953C1C61 FOREIGN KEY (source_id) REFERENCES source (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE login_attempt ADD CONSTRAINT FK_8C11C1BA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE login_history ADD CONSTRAINT FK_37976E36A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE verification_token ADD CONSTRAINT FK_C1CC006BA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        throw new IrreversibleMigration('Sometimes in life you have to accept that you can\'t go back.');
    }
}
