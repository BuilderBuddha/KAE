import type { ConnectorContext, ConnectorId, ConnectorSchedule } from '@scooper/core';

type SyncHandler = (
  connectorId: ConnectorId,
  context: ConnectorContext,
) => Promise<unknown>;

/** In-process timer scheduler for background connector monitoring. */
export class ConnectorScheduler {
  private timers = new Map<ConnectorId, ReturnType<typeof setInterval>>();
  private schedules = new Map<ConnectorId, ConnectorSchedule>();

  constructor(private readonly onSync: SyncHandler) {}

  load(schedules: ConnectorSchedule[]): void {
    this.stop();
    for (const schedule of schedules) {
      this.schedules.set(schedule.connectorId, schedule);
      if (schedule.enabled && schedule.intervalMinutes > 0) {
        this.enable(schedule.connectorId, schedule.intervalMinutes);
      }
    }
  }

  export(): ConnectorSchedule[] {
    return Array.from(this.schedules.values());
  }

  enable(connectorId: ConnectorId, intervalMinutes: number): void {
    this.disable(connectorId);
    const schedule: ConnectorSchedule = {
      connectorId,
      intervalMinutes,
      enabled: true,
      lastRunAt: this.schedules.get(connectorId)?.lastRunAt,
      nextRunAt: new Date(Date.now() + intervalMinutes * 60_000).toISOString(),
    };
    this.schedules.set(connectorId, schedule);

    const timer = setInterval(() => {
      void this.onSync(connectorId, {
        repositoryPath: '',
        log: () => undefined,
      }).then(() => {
        const current = this.schedules.get(connectorId);
        if (!current) return;
        this.schedules.set(connectorId, {
          ...current,
          lastRunAt: new Date().toISOString(),
          nextRunAt: new Date(Date.now() + intervalMinutes * 60_000).toISOString(),
        });
      });
    }, intervalMinutes * 60_000);
    this.timers.set(connectorId, timer);
  }

  isActive(connectorId: ConnectorId): boolean {
    return this.timers.has(connectorId);
  }

  disable(connectorId: ConnectorId): void {
    const timer = this.timers.get(connectorId);
    if (timer) clearInterval(timer);
    this.timers.delete(connectorId);
    const current = this.schedules.get(connectorId);
    if (current) {
      this.schedules.set(connectorId, { ...current, enabled: false, nextRunAt: undefined });
    }
  }

  stop(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
  }
}
