export type ImportJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportJob {
  jobId: string;
  type: string;
  fileName: string;
  status: ImportJobStatus;
  progress: number;
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: ImportRowError[];
  message: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Set locally by CategoryImportService while polling to indicate the last poll
  // request failed but is being retried - never comes from the backend.
  networkError?: boolean;
}

export const TERMINAL_IMPORT_STATUSES: ImportJobStatus[] = ['completed', 'failed', 'cancelled'];

export const isTerminalImportStatus = (status: ImportJobStatus): boolean =>
  TERMINAL_IMPORT_STATUSES.includes(status);
