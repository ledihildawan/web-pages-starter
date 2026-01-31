import { isDebugMode } from '../config/build';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface NavigationLog {
  from: string;
  to: string;
  timestamp: number;
}

interface ResourceLog {
  action: 'load' | 'unload' | 'cache-hit';
  url: string;
  timestamp: number;
}

interface ErrorLog {
  type: string;
  error: Error;
  timestamp: number;
}

interface PerformanceEntry {
  label: string;
  startTime: number;
  duration: number | null;
}

class DebugManager {
  private enabled: boolean;
  private navigationLogs: NavigationLog[] = [];
  private resourceLogs: ResourceLog[] = [];
  private errorLogs: ErrorLog[] = [];
  private performanceEntries: Map<string, PerformanceEntry> = new Map();
  private maxLogEntries: number = 100;

  constructor() {
    this.enabled = isDebugMode();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }

  logMemory(stage: string): void {
    if (!this.enabled) return;

    const memory = (performance as any).memory as MemoryInfo;
    if (!memory) {
      console.warn(`[Debug] Memory API not available`);
      return;
    }

    const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
    const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
    const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
    const percentage = Math.round((usedMB / limitMB) * 100);

    console.log(`[Memory] ${stage}:`);
    console.log(`  Used: ${this.formatBytes(memory.usedJSHeapSize)}`);
    console.log(`  Total: ${this.formatBytes(memory.totalJSHeapSize)}`);
    console.log(`  Limit: ${this.formatBytes(memory.jsHeapSizeLimit)}`);
    console.log(`  Usage: ${percentage}%`);

    if (percentage > 80) {
      console.warn(`[Memory] ⚠️  High heap usage: ${percentage}%`);
    }
  }

  printMemoryReport(): void {
    if (!this.enabled) return;

    const memory = (performance as any).memory as MemoryInfo;
    if (!memory) {
      console.warn(`[Debug] Memory API not available`);
      return;
    }

    console.log('\n=== Memory Report ===');
    console.log(`Used JS Heap: ${this.formatBytes(memory.usedJSHeapSize)}`);
    console.log(`Total JS Heap: ${this.formatBytes(memory.totalJSHeapSize)}`);
    console.log(`JS Heap Limit: ${this.formatBytes(memory.jsHeapSizeLimit)}`);
    console.log(`Heap Usage: ${Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)}%`);
    console.log('====================\n');

    if ((performance as any).memory) {
      const heapStatistics = (performance as any).memory as any;
      if (heapStatistics.usedJSHeapSize) {
        console.log('Heap Statistics:');
        console.log(`- Used: ${this.formatBytes(heapStatistics.usedJSHeapSize)}`);
      }
      if (heapStatistics.totalJSHeapSize) {
        console.log(`- Total: ${this.formatBytes(heapStatistics.totalJSHeapSize)}`);
      }
      if (heapStatistics.jsHeapSizeLimit) {
        console.log(`- Limit: ${this.formatBytes(heapStatistics.jsHeapSizeLimit)}`);
      }
    }
  }

  logNavigation(from: string, to: string): void {
    if (!this.enabled) return;

    const log: NavigationLog = {
      from,
      to,
      timestamp: Date.now()
    };

    this.navigationLogs.push(log);
    this.limitLogs();

    console.log(`[Navigation] ${from} → ${to}`);
  }

  printNavigationHistory(): void {
    if (!this.enabled) return;

    console.log('\n=== Navigation History ===');
    this.navigationLogs.forEach((log, index) => {
      const time = new Date(log.timestamp).toISOString();
      console.log(`${index + 1}. [${time}] ${log.from} → ${log.to}`);
    });
    console.log('=========================\n');
  }

  timeStart(label: string): void {
    if (!this.enabled) return;

    const entry: PerformanceEntry = {
      label,
      startTime: performance.now(),
      duration: null
    };

    this.performanceEntries.set(label, entry);
    console.log(`[Timer] Started: ${label}`);
  }

  timeEnd(label: string): number {
    if (!this.enabled) return 0;

    const entry = this.performanceEntries.get(label);
    if (!entry) {
      console.warn(`[Timer] No timer found for: ${label}`);
      return 0;
    }

    entry.duration = performance.now() - entry.startTime;
    this.performanceEntries.set(label, entry);

    console.log(`[Timer] ${label}: ${entry.duration.toFixed(2)}ms`);
    return entry.duration;
  }

  logResource(action: 'load' | 'unload' | 'cache-hit', url: string): void {
    if (!this.enabled) return;

    const log: ResourceLog = {
      action,
      url,
      timestamp: Date.now()
    };

    this.resourceLogs.push(log);
    this.limitLogs();

    console.log(`[Resource] ${action.toUpperCase()}: ${url}`);
  }

  printResourceSummary(): void {
    if (!this.enabled) return;

    const loadCount = this.resourceLogs.filter(l => l.action === 'load').length;
    const unloadCount = this.resourceLogs.filter(l => l.action === 'unload').length;
    const cacheHitCount = this.resourceLogs.filter(l => l.action === 'cache-hit').length;

    console.log('\n=== Resource Summary ===');
    console.log(`Loaded: ${loadCount}`);
    console.log(`Unloaded: ${unloadCount}`);
    console.log(`Cache Hits: ${cacheHitCount}`);
    console.log(`Total Operations: ${this.resourceLogs.length}`);
    console.log('=======================\n');
  }

  logError(type: string, error: Error): void {
    if (!this.enabled) return;

    const log: ErrorLog = {
      type,
      error,
      timestamp: Date.now()
    };

    this.errorLogs.push(log);
    this.limitLogs();

    console.error(`[Error] ${type}:`, error.message);
    console.error('Stack trace:', error.stack);
  }

  printErrorLog(): void {
    if (!this.enabled) return;

    console.log('\n=== Error Log ===');
    this.errorLogs.forEach((log, index) => {
      const time = new Date(log.timestamp).toISOString();
      console.log(`${index + 1}. [${time}] ${log.type}: ${log.error.message}`);
    });
    console.log('================\n');
  }

  printPerformanceReport(): void {
    if (!this.enabled) return;

    console.log('\n=== Performance Report ===');
    this.performanceEntries.forEach((entry, label) => {
      if (entry.duration !== null) {
        console.log(`${label}: ${entry.duration.toFixed(2)}ms`);
      }
    });
    console.log('==========================\n');

    if (this.performanceEntries.size > 0) {
      const durations = Array.from(this.performanceEntries.values())
        .map(e => e.duration)
        .filter((d): d is number => d !== null);

      if (durations.length > 0) {
        const total = durations.reduce((a, b) => a + b, 0);
        const avg = total / durations.length;
        const max = Math.max(...durations);
        const min = Math.min(...durations);

        console.log('Statistics:');
        console.log(`- Total time: ${total.toFixed(2)}ms`);
        console.log(`- Average: ${avg.toFixed(2)}ms`);
        console.log(`- Min: ${min.toFixed(2)}ms`);
        console.log(`- Max: ${max.toFixed(2)}ms`);
        console.log();
      }
    }
  }

  detectBottlenecks(thresholdMs: number = 100): void {
    if (!this.enabled) return;

    const bottlenecks = Array.from(this.performanceEntries.values())
      .filter(entry => entry.duration !== null && entry.duration > thresholdMs);

    if (bottlenecks.length > 0) {
      console.log('\n=== Bottlenecks Detected (> ' + thresholdMs + 'ms) ===');
      bottlenecks.forEach(entry => {
        console.log(`⚠️  ${entry.label}: ${entry.duration?.toFixed(2)}ms`);
      });
      console.log('=============================================\n');
    } else {
      console.log('\n✅ No bottlenecks detected\n');
    }
  }

  printFullReport(): void {
    if (!this.enabled) return;

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                   DEBUG REPORT                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    this.printMemoryReport();
    this.printNavigationHistory();
    this.printResourceSummary();
    this.printErrorLog();
    this.printPerformanceReport();
    this.detectBottlenecks();
  }

  clearLogs(): void {
    this.navigationLogs = [];
    this.resourceLogs = [];
    this.errorLogs = [];
    this.performanceEntries.clear();

    if (this.enabled) {
      console.log('[Debug] All logs cleared');
    }
  }

  private limitLogs(): void {
    if (this.navigationLogs.length > this.maxLogEntries) {
      this.navigationLogs = this.navigationLogs.slice(-this.maxLogEntries);
    }
    if (this.resourceLogs.length > this.maxLogEntries) {
      this.resourceLogs = this.resourceLogs.slice(-this.maxLogEntries);
    }
    if (this.errorLogs.length > this.maxLogEntries) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogEntries);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const debug = new DebugManager();

(window as any).debug = debug;
