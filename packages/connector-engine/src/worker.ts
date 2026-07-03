import type { ConnectorId, ConnectorSchedule } from '@scooper/core';
import { ConnectorScheduler } from './scheduler.js';

/** Background worker that owns persistent connector monitoring timers. */
export class BackgroundConnectorWorker {
  constructor(private readonly scheduler: ConnectorScheduler) {}

  start(schedules: ConnectorSchedule[]): void {
    this.scheduler.load(schedules);
  }

  stop(): void {
    this.scheduler.stop();
  }

  schedule(connectorId: ConnectorId, intervalMinutes: number): void {
    this.scheduler.enable(connectorId, intervalMinutes);
  }

  unschedule(connectorId: ConnectorId): void {
    this.scheduler.disable(connectorId);
  }

  getSchedules(): ConnectorSchedule[] {
    return this.scheduler.export();
  }

  isActive(connectorId: ConnectorId): boolean {
    return this.scheduler.isActive(connectorId);
  }
}
