import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, map, switchMap, takeWhile, tap } from 'rxjs/operators';
import { getApiUrl } from '../config/api.config';
import { ImportJob, isTerminalImportStatus } from '../models/import-job.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryImportService {
  private readonly importUrl = `${getApiUrl('categories')}/import`;

  // How often to poll, and how many consecutive failed polls to tolerate before giving
  // up on the import (see pollImportStatus below).
  private readonly POLL_INTERVAL_MS = 500;
  private readonly MAX_CONSECUTIVE_POLL_FAILURES = 3;

  constructor(private http: HttpClient) {}

  /*
   * Uploads the file with upload-progress events enabled (reportProgress + observe:
   * 'events'), so the component can render "Upload progress: 75%" while the multipart
   * body is still being sent - this is a *different* progress than the import job's
   * own progress, and finishes as soon as the file has reached the server, well before
   * the background worker has processed any rows.
   */
  uploadImportFile(file: File): Observable<HttpEvent<ApiResponse<{ jobId: string; status: string }>>> {
   
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<{ jobId: string; status: string }>>(this.importUrl, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  getImportStatus(jobId: string): Observable<ImportJob> {
    return this.http
      .get<ApiResponse<ImportJob>>(`${this.importUrl}/${jobId}/status`)
      .pipe(map((res) => res.data));
  }

  cancelImport(jobId: string): Observable<ImportJob> {
    return this.http
      .post<ApiResponse<ImportJob>>(`${this.importUrl}/${jobId}/cancel`, {})
      .pipe(map((res) => res.data));
  }

  /*
   * Reusable polling stream for a single import job's status. Subscribers get a plain
   * stream of ImportJob values and never need an `error` callback - every failure mode
   * (including "gave up retrying") is represented as a normal, terminal ImportJob value.
   *
   * Operators used, and why:
   *
   * - timer(0, POLL_INTERVAL_MS): emits immediately, then every 2s after.
   * - switchMap: maps each timer tick to the status HTTP call. Critically, timer's next
   *   tick is scheduled by the *outer* interval regardless of the inner call's duration,
   *   but switchMap cancels/ignores any previous inner subscription before starting a
   *   new one - combined with the fact each inner call already completes (HTTP requests
   *   complete on response), this means requests are naturally sequenced: a slow response
   *   simply delays how soon its *own* value is emitted, it never causes two status
   *   requests to be in flight at once, because there is only ever one inner observable
   *   alive per switchMap at a time.
   * - inner catchError + tap: a single network hiccup shouldn't be reported as an import
   *   failure. Transient HTTP failures are swallowed - up to MAX_CONSECUTIVE_POLL_FAILURES
   *   in a row - and re-emit the last known good job with `networkError: true` so the UI
   *   can show a "reconnecting..." hint without losing the last real progress shown, or
   *   treating a blip as a failed import. A 400/404 (malformed or unknown job id) is
   *   never transient, so it skips the retry budget and fails immediately.
   * - takeWhile(..., true): keeps the stream alive while status is queued/processing; the
   *   `true` (inclusive) argument makes sure the terminal value itself is still delivered
   *   to subscribers before the stream completes, rather than being swallowed.
   * - outer catchError: once the retry budget is exhausted, converts the thrown error into
   *   one final synthetic "failed" ImportJob (carrying forward the last known counts)
   *   instead of letting the error propagate - so `pollImportStatus(...).subscribe(job =>
   *   ...)` is all a caller ever needs to write.
   */
  pollImportStatus(jobId: string): Observable<ImportJob> {
    let consecutiveFailures = 0;
    let lastKnownJob: ImportJob | null = null;

    return timer(0, this.POLL_INTERVAL_MS).pipe(
      switchMap(() =>
        this.getImportStatus(jobId).pipe(
          tap((job) => {
            consecutiveFailures = 0;
            lastKnownJob = job;
          }),
          catchError((error: HttpErrorResponse) => {
            const isPermanentError = error.status === 400 || error.status === 404;
            consecutiveFailures += 1;

            if (isPermanentError || !lastKnownJob || consecutiveFailures >= this.MAX_CONSECUTIVE_POLL_FAILURES) {
              return throwError(() => error);
            }

            return of({ ...lastKnownJob, networkError: true });
          })
        )
      ),
      takeWhile((job) => !isTerminalImportStatus(job.status), true),
      catchError((error: HttpErrorResponse) => {
        const fallbackMessage =
          error.status === 404
            ? 'Import job not found. It may have been removed.'
            : error.status === 400
            ? 'Invalid import job reference.'
            : 'Lost connection to the server while checking import status.';

        return of({
          jobId,
          type: 'category',
          fileName: lastKnownJob?.fileName ?? '',
          status: 'failed',
          progress: lastKnownJob?.progress ?? 0,
          totalRecords: lastKnownJob?.totalRecords ?? 0,
          processedRecords: lastKnownJob?.processedRecords ?? 0,
          successfulRecords: lastKnownJob?.successfulRecords ?? 0,
          failedRecords: lastKnownJob?.failedRecords ?? 0,
          errors: lastKnownJob?.errors ?? [],
          message: fallbackMessage,
          startedAt: lastKnownJob?.startedAt ?? null,
          completedAt: new Date().toISOString(),
          createdAt: lastKnownJob?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as ImportJob);
      })
    );
  }
}
