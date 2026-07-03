import type { FileReference, JobId, JobStatus, ImporterFormatId } from '../types/index.js';

/** An import job tracked by the job queue. */
export interface ImportJob {
  id: JobId;
  format: ImporterFormatId;
  source: FileReference;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  progress: number;
  error?: string;
  summary?: import('../types/index.js').ImportSummary;
}

/** Creates a new import job in pending state. */
export function createImportJob(
  id: JobId,
  format: ImporterFormatId,
  source: FileReference,
): ImportJob {
  const now = new Date().toISOString();
  return {
    id,
    format,
    source,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    progress: 0,
  };
}

/** Job queue interface for managing import jobs. */
export interface JobQueue {
  enqueue(job: ImportJob): void;
  dequeue(): ImportJob | undefined;
  getAll(): ImportJob[];
  getById(id: JobId): ImportJob | undefined;
  updateStatus(id: JobId, status: JobStatus, progress?: number, error?: string): void;
  clear(): void;
}

/** In-memory job queue implementation. */
export class InMemoryJobQueue implements JobQueue {
  private jobs: ImportJob[] = [];

  enqueue(job: ImportJob): void {
    this.jobs.push(job);
  }

  dequeue(): ImportJob | undefined {
    const next = this.jobs.find((j) => j.status === 'queued' || j.status === 'pending');
    return next;
  }

  getAll(): ImportJob[] {
    return [...this.jobs];
  }

  getById(id: JobId): ImportJob | undefined {
    return this.jobs.find((j) => j.id === id);
  }

  updateStatus(id: JobId, status: JobStatus, progress?: number, error?: string): void {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) return;
    job.status = status;
    job.updatedAt = new Date().toISOString();
    if (progress !== undefined) job.progress = progress;
    if (error !== undefined) job.error = error;
  }

  clear(): void {
    this.jobs = [];
  }
}
