<?php

declare(strict_types=1);

namespace Basango\SharedKernel\Infrastructure\Persistence\Doctrine\Importer;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Statement;
use Doctrine\ORM\EntityManagerInterface;
use Generator;
use PDO;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Uid\Uuid;
use Throwable;

/**
 * ImportEngine: unified, naming-accurate API for migrating data
 * from a source database (old MariaDB over PDO) to a target database
 * (new PostgreSQL via Doctrine DBAL/ORM).
 *
 * - Source: MariaDB/MySQL via PDO (unbuffered)
 * - Target: PostgreSQL via Doctrine DBAL/ORM
 *
 * Memory tactics:
 *  - Reuse a fixed-size params array for inserts (no per-row allocations)
 *  - Stream source rows unbuffered; close cursor in finally
 *  - Batch transactions; commit regularly
 *  - Disable DBAL middlewares/loggers; disable PDO emulate prepares
 *  - Periodic gc_collect_cycles() on long runs
 */
final readonly class ImportEngine
{
    /**
     * Columns to ignore per target table.
     * Key = normalized table name (lowercase, unquoted),
     * Value = list of column names to exclude from insert.
     */
    private const array IGNORE_COLUMNS = [
        'article' => ['tsv', 'image', 'excerpt'],
    ];

    private Connection $targetConnection;

    private PDO $sourceConnection;

    public function __construct(
        private EntityManagerInterface $em,
        #[Autowire(env: 'SOURCE_DATABASE_HOST')] private string $host,
        #[Autowire(env: 'SOURCE_DATABASE_USER')] private string $user,
        #[Autowire(env: 'SOURCE_DATABASE_PASS')] private string $pass,
        #[Autowire(env: 'SOURCE_DATABASE_PORT')] private int $port = 3306,
        #[Autowire(env: 'SOURCE_DATABASE_NAME')] private string $name = 'app',
    ) {
        // Target (PostgreSQL via Doctrine DBAL)
        $this->targetConnection = $this->em->getConnection();
        $this->targetConnection->getConfiguration()->setMiddlewares([]);

        // If DBAL exposes a native PDO, harden it for low memory
        try {
            $native = $this->targetConnection->getNativeConnection();
            if ($native instanceof PDO) {
                // Use server-side prepares; avoids driver-side buffering
                $native->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
                $native->setAttribute(PDO::ATTR_STRINGIFY_FETCHES, false);
                $native->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            }
        } catch (\Throwable) {
            // If the platform/driver doesn’t expose a PDO, ignore safely
        }

        // Source (MariaDB/MySQL via PDO), unbuffered
        $this->sourceConnection = new PDO(
            dsn: sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $this->host, $this->port, $this->name),
            username: $this->user,
            password: $this->pass,
            options: [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );

        // Unbuffered cursor (critical for memory)
        if (defined('PDO::MYSQL_ATTR_USE_BUFFERED_QUERY')) {
            $this->sourceConnection->setAttribute(constant('PDO::MYSQL_ATTR_USE_BUFFERED_QUERY'), false);
        }
    }

    public function import(string $table, int $batchSize = 1000): int
    {
        $this->reset($table);
        $rows = $this->copy($table);
        return $this->paste($table, $rows, $batchSize);
    }

    /**
     * Truncate target table safely with replication role toggling.
     */
    private function reset(string $tableName): void
    {
        $platform = $this->targetConnection->getDatabasePlatform();
        $this->targetConnection->beginTransaction();

        try {
            $this->targetConnection->executeStatement("SET session_replication_role = 'replica'");
            $sql = $platform->getTruncateTableSQL($tableName, true);
            $this->targetConnection->executeStatement($sql);
            $this->targetConnection->executeStatement("SET session_replication_role = 'origin'");
            $this->targetConnection->commit();
        } catch (Throwable $e) {
            if ($this->targetConnection->isTransactionActive()) {
                $this->targetConnection->rollBack();
            }

            throw $e;
        }
    }

    /**
     * Stream rows from MySQL unbuffered; ensure cursor is always closed.
     */
    private function copy(string $table): iterable
    {
        $sql = sprintf('SELECT * FROM `%s`', str_replace('`', '', $table));
        $stmt = $this->sourceConnection->query($sql);

        if ($stmt === false) {
            // Return an empty iterable on failure
            return [];
        }

        return (function () use ($stmt): Generator {
            try {
                while (($row = $stmt->fetch(PDO::FETCH_ASSOC)) !== false) {
                    yield $row;
                }
            } finally {
                // Free server resources ASAP
                $stmt->closeCursor();
            }
        })();
    }

    /**
     * Insert rows into PostgreSQL with minimal allocations.
     * - Fixed-size $params array reused per row
     * - Batch transactions to limit peak memory
     * - Periodic GC for long streams
     */
    private function paste(string $table, iterable $rows, int $batchSize = 1000): int
    {
        if ($batchSize <= 0) {
            $batchSize = 1000;
        }

        $platform = $this->targetConnection->getDatabasePlatform();
        $quote = static fn (string|int $id) => $platform->quoteIdentifier((string) $id);

        $ignored = $this->ignoredColumnsFor($table);
        $ignoredFlip = $ignored !== [] ? array_flip($ignored) : [];

        $columns = null;
        $statement = null;
        $params = null; // fixed-size, reused
        $total = 0;
        $inBatch = 0;

        try {
            foreach ($rows as $row) {
                // Build statement on first row (after ignoring columns)
                if ($columns === null) {
                    if ($ignoredFlip !== []) {
                        $row = array_diff_key($row, $ignoredFlip);
                    }

                    /** @var list<string> $columns */
                    $columns = array_map(static fn (int|string $k): string => (string) $k, array_keys($row));
                    $columnList = implode(', ', array_map($quote, $columns));
                    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
                    $sql = sprintf('INSERT INTO %s (%s) VALUES (%s)', $quote($table), $columnList, $placeholders);
                    $statement = $this->targetConnection->prepare($sql);

                    // Allocate params array once, with fixed size
                    $params = array_fill(0, count($columns), null);

                    // Begin first batch transaction
                    $this->targetConnection->beginTransaction();
                }

                // Fill params by index (avoid per-row array allocs)
                $i = 0;
                foreach ($columns as $col) {
                    $val = $row[$col] ?? null;

                    if ($val !== null) {
                        if ($col === 'id' || str_ends_with((string) $col, '_id')) {
                            $params[$i++] = $this->normalizeUuidValue($val);
                            continue;
                        }

                        // Convert invalid date to now()
                        if (str_ends_with((string) $col, '_at') && $val === '0000-00-00 00:00:00') {
                            $val = new \DateTimeImmutable('now')->format('Y-m-d H:i:s');
                            $params[$i++] = $val;
                            continue;
                        }

                        // Convert categories to PG text[] literal cheaply
                        if ($col === 'categories') {
                            if (is_string($val)) {
                                $val = $this->ensureUtf8String($val);
                            }

                            $params[$i++] = sprintf('{%s}', $val);
                            continue;
                        }

                        if (is_string($val)) {
                            $params[$i++] = $this->ensureUtf8String($val);
                            continue;
                        }
                    }

                    $params[$i++] = $val;
                }

                if (! $statement instanceof Statement) {
                    throw new \LogicException('Insert statement not initialized.');
                }

                // @phpstan-ignore-next-line
                $statement->executeStatement($params);
                $total++;
                $inBatch++;

                if ($inBatch >= $batchSize) {
                    $this->targetConnection->commit();
                    $inBatch = 0;

                    // Start next batch transaction
                    $this->targetConnection->beginTransaction();

                    // Help GC on very long imports
                    if (($total % ($batchSize * 5)) === 0) {
                        gc_collect_cycles();
                    }
                }
            }

            // Commit trailing rows if any
            if ($inBatch > 0 && $this->targetConnection->isTransactionActive()) {
                $this->targetConnection->commit();
            }
        } catch (Throwable $e) {
            if ($this->targetConnection->isTransactionActive()) {
                $this->targetConnection->rollBack();
            }

            // Keep failure payloads small to avoid memory spikes
            throw $e;
        } finally {
            // Release large references promptly
            $statement = null;
            $columns = null;
            $params = null;
            gc_collect_cycles();
        }

        return $total;
    }

    private function ignoredColumnsFor(string $table): array
    {
        $normalized = strtolower(trim($table, '`"'));
        return self::IGNORE_COLUMNS[$normalized] ?? [];
    }

    /**
     * Keep it cheap: fast-path valid UTF-8; otherwise minimal conversions.
     */
    private function ensureUtf8String(string $value): string
    {
        // Fast path: valid UTF-8
        if (@preg_match('//u', $value) === 1) {
            return $value;
        }

        // Try common legacy encodings with transliteration
        $converted = @iconv('CP1252', 'UTF-8//TRANSLIT', $value);
        if ($converted === false) {
            $converted = @iconv('ISO-8859-1', 'UTF-8//TRANSLIT', $value);
        }

        if ($converted === false) {
            // Last resort: drop invalid sequences
            $converted = @iconv('UTF-8', 'UTF-8//IGNORE', $value);
        }

        return $converted !== false ? $converted : $value;
    }

    private function normalizeUuidValue(mixed $value): string
    {
        if ($value instanceof Uuid) {
            return (string) $value;
        }

        if (is_string($value)) {
            return Uuid::fromBinary($value)->toString();
        }

        return (string) $value;
    }
}
