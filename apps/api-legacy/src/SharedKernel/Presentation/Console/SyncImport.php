<?php

declare(strict_types=1);

namespace Basango\SharedKernel\Presentation\Console;

use Basango\SharedKernel\Infrastructure\Persistence\Doctrine\Importer\ImportEngine;
use Override;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:sync-import',
    description: 'from mariadb to postgres'
)]
class SyncImport extends Command
{
    use AskArgumentFeature;

    private SymfonyStyle $io;

    public function __construct(
        private readonly ImportEngine $importEngine
    ) {
        parent::__construct();
    }

    #[Override]
    protected function initialize(InputInterface $input, OutputInterface $output): void
    {
        $this->io = new SymfonyStyle($input, $output);
    }

    #[Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        if (! $this->io->confirm('Do you want to continue?', false)) {
            $this->io->warning('Process aborted');
            return Command::FAILURE;
        }

        $tables = ['user', 'source', 'article'];
        foreach ($tables as $table) {
            $count = $this->importEngine->import($table);
            $this->io->text(sprintf('Imported %d records into %s table.', $count, $table));
        }

        $this->io->success('Source add successfully');
        return Command::SUCCESS;
    }
}
