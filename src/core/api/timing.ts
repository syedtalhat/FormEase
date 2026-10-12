/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TimingRecord {
  path: 'cache-hit' | 'cache-miss';
  endpoint: string;
  durationMs: number;
  timestamp: number;
}

/**
 * Calculates percentile value from array of numbers.
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

class PerformanceTracker {
  private records: TimingRecord[] = [];
  private maxRecords = 500;

  record(path: 'cache-hit' | 'cache-miss', endpoint: string, durationMs: number): TimingRecord {
    const record: TimingRecord = {
      path,
      endpoint,
      durationMs,
      timestamp: Date.now(),
    };
    this.records.push(record);
    if (this.records.length > this.maxRecords) {
      this.records.shift();
    }

    this.logP95Summary();
    return record;
  }

  getP95(path: 'cache-hit' | 'cache-miss'): number {
    const samples = this.records.filter((r) => r.path === path).map((r) => r.durationMs);
    return calculatePercentile(samples, 95);
  }

  getAllRecords(): TimingRecord[] {
    return [...this.records];
  }

  clear(): void {
    this.records = [];
  }

  logP95Summary(): void {
    const hits = this.records.filter((r) => r.path === 'cache-hit').map((r) => r.durationMs);
    const misses = this.records.filter((r) => r.path === 'cache-miss').map((r) => r.durationMs);

    if (hits.length > 0 || misses.length > 0) {
      const p95Hit = calculatePercentile(hits, 95);
      const p95Miss = calculatePercentile(misses, 95);

      // p95 timing log for cache-hit (<300 ms) and miss (<4 s) paths (NFR-PERF.1–2)
      console.log(
        `[FormAssist Perf] p95 Timing Log (NFR-PERF.1-2): cache-hit=${p95Hit.toFixed(
          1
        )}ms (target <300ms, n=${hits.length}) | cache-miss=${p95Miss.toFixed(
          1
        )}ms (target <4000ms, n=${misses.length})`
      );
    }
  }
}

export const perfTracker = new PerformanceTracker();
