import type {
  SearchProgressReporter,
  SearchSynchronizationProgress,
} from "#db/synchronizers/search";

const PROGRESS_BAR_WIDTH = 24;

type ProgressOperation<T> = (reportProgress: SearchProgressReporter | undefined) => Promise<T>;

export async function runWithSearchProgress<T>(
  label: string,
  operation: ProgressOperation<T>,
): Promise<T> {
  const isInteractive = process.stderr.isTTY === true;
  let hasRendered = false;

  function reportProgress(progress: SearchSynchronizationProgress): void {
    process.stderr.write(`\r\u001B[2K${formatSearchProgress(label, progress)}`);
    hasRendered = true;
  }

  try {
    const result = await operation(isInteractive ? reportProgress : undefined);

    if (hasRendered) {
      process.stderr.write("\n");
    }

    return result;
  } catch (error) {
    if (hasRendered) {
      process.stderr.write("\n");
    }

    throw error;
  }
}

export function formatSearchProgress(
  label: string,
  progress: SearchSynchronizationProgress,
  width = PROGRESS_BAR_WIDTH,
): string {
  const completed = Math.max(0, progress.completed);
  const total = Math.max(0, progress.total, completed);
  const ratio = total === 0 ? 1 : Math.min(completed / total, 1);
  const percentage = Math.floor(ratio * 100);
  const completedWidth = Math.round(ratio * width);
  const bar = `${"#".repeat(completedWidth)}${"-".repeat(width - completedWidth)}`;

  return `${label} [${bar}] ${String(percentage).padStart(3)}% (${completed}/${total})`;
}
