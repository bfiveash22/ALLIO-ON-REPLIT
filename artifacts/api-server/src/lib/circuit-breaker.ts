export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  name: string;
}

interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure?: string;
  lastSuccess?: string;
  openedAt?: string;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private successes = 0;
  private lastFailure?: Date;
  private lastSuccess?: Date;
  private openedAt?: Date;
  private totalCalls = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;

  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly timeout: number;
  readonly name: string;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.successThreshold = options.successThreshold ?? 2;
    this.timeout = options.timeout ?? 60000;
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    this.totalCalls++;

    if (this.state === "OPEN") {
      const now = Date.now();
      const opened = this.openedAt?.getTime() ?? 0;
      if (now - opened >= this.timeout) {
        this.state = "HALF_OPEN";
        this.successes = 0;
      } else {
        throw new Error(`Circuit breaker [${this.name}] is OPEN — refusing call`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.totalSuccesses++;
    this.lastSuccess = new Date();
    this.successes++;
    this.failures = 0;

    if (this.state === "HALF_OPEN" && this.successes >= this.successThreshold) {
      this.state = "CLOSED";
      this.openedAt = undefined;
    }
  }

  private onFailure(): void {
    this.totalFailures++;
    this.lastFailure = new Date();
    this.failures++;
    this.successes = 0;

    if (this.state === "HALF_OPEN" || this.failures >= this.failureThreshold) {
      this.state = "OPEN";
      this.openedAt = new Date();
    }
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure?.toISOString(),
      lastSuccess: this.lastSuccess?.toISOString(),
      openedAt: this.openedAt?.toISOString(),
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  recordFailure(): void {
    this.onFailure();
  }

  recordSuccess(): void {
    this.onSuccess();
  }

  reset(): void {
    this.state = "CLOSED";
    this.failures = 0;
    this.successes = 0;
    this.openedAt = undefined;
  }
}

const registry = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
  if (!registry.has(options.name)) {
    registry.set(options.name, new CircuitBreaker(options));
  }
  return registry.get(options.name)!;
}

export function getAllCircuitBreakerStats(): Record<string, CircuitBreakerStats> {
  const result: Record<string, CircuitBreakerStats> = {};
  for (const [name, cb] of registry.entries()) {
    result[name] = cb.getStats();
  }
  return result;
}

export const circuitBreakers = {
  stripe: getCircuitBreaker({ name: "stripe", failureThreshold: 3, timeout: 30000 }),
  woocommerce: getCircuitBreaker({ name: "woocommerce", failureThreshold: 3, timeout: 60000 }),
  signnow: getCircuitBreaker({ name: "signnow", failureThreshold: 3, timeout: 60000 }),
  googledrive: getCircuitBreaker({ name: "googledrive", failureThreshold: 3, timeout: 60000 }),
  openai: getCircuitBreaker({ name: "openai", failureThreshold: 5, timeout: 30000 }),
  anthropic: getCircuitBreaker({ name: "anthropic", failureThreshold: 5, timeout: 30000 }),
};
