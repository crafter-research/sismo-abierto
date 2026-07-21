import type {
  ObservedChange,
  SourceCheck,
  SourceState,
} from "@sismo/contracts";

export interface SourceHealthStore {
  insertCheck(check: SourceCheck): Promise<void>;
  listChecks(sourceId: string, limit: number): Promise<SourceCheck[]>;
  getState(sourceId: string): Promise<SourceState | null>;
  setState(state: SourceState): Promise<void>;
  listStates(): Promise<SourceState[]>;
  insertChange(change: ObservedChange): Promise<void>;
  getOpenChange(sourceId: string): Promise<ObservedChange | null>;
  closeChange(
    changeId: string,
    closedAt: string,
    closingCheckId: string,
  ): Promise<void>;
  listChanges(sourceId: string, limit: number): Promise<ObservedChange[]>;
}

export class MemorySourceHealthStore implements SourceHealthStore {
  private checks: SourceCheck[] = [];
  private states = new Map<string, SourceState>();
  private changes: ObservedChange[] = [];

  async insertCheck(check: SourceCheck): Promise<void> {
    this.checks.push(check);
  }

  async listChecks(sourceId: string, limit: number): Promise<SourceCheck[]> {
    return this.checks
      .filter((check) => check.sourceId === sourceId)
      .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))
      .slice(0, limit);
  }

  async getState(sourceId: string): Promise<SourceState | null> {
    return this.states.get(sourceId) ?? null;
  }

  async setState(state: SourceState): Promise<void> {
    this.states.set(state.sourceId, state);
  }

  async listStates(): Promise<SourceState[]> {
    return [...this.states.values()];
  }

  async insertChange(change: ObservedChange): Promise<void> {
    this.changes.push(change);
  }

  async getOpenChange(sourceId: string): Promise<ObservedChange | null> {
    return (
      this.changes.find(
        (change) => change.sourceId === sourceId && change.closedAt === null,
      ) ?? null
    );
  }

  async closeChange(
    changeId: string,
    closedAt: string,
    closingCheckId: string,
  ): Promise<void> {
    const change = this.changes.find((entry) => entry.id === changeId);
    if (change) {
      change.closedAt = closedAt;
      change.closingCheckId = closingCheckId;
    }
  }

  async listChanges(
    sourceId: string,
    limit: number,
  ): Promise<ObservedChange[]> {
    return this.changes
      .filter((change) => change.sourceId === sourceId)
      .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
      .slice(0, limit);
  }
}
