interface TokenBucketOptions {
  name: string;
  tokensPerSecond: number;
  maxTokens: number;
}

class TokenBucket {
  readonly name: string;
  private tokens: number;
  private readonly maxTokens: number;
  private readonly tokensPerMs: number;
  private lastRefill: number;
  private totalRequests = 0;
  private totalThrottled = 0;

  constructor(options: TokenBucketOptions) {
    this.name = options.name;
    this.maxTokens = options.maxTokens;
    this.tokens = options.maxTokens;
    this.tokensPerMs = options.tokensPerSecond / 1000;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const refill = elapsed * this.tokensPerMs;
    this.tokens = Math.min(this.maxTokens, this.tokens + refill);
    this.lastRefill = now;
  }

  tryConsume(tokens = 1): boolean {
    this.refill();
    this.totalRequests++;
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    this.totalThrottled++;
    return false;
  }

  async consume(tokens = 1): Promise<void> {
    if (this.tryConsume(tokens)) {
      return;
    }
    this.refill();
    const needed = tokens - this.tokens;
    const waitMs = Math.ceil(needed / this.tokensPerMs);
    await new Promise<void>((resolve) => setTimeout(resolve, Math.min(waitMs, 10_000)));
    this.tokens -= tokens;
  }

  getStats(): { name: string; tokens: number; maxTokens: number; totalRequests: number; totalThrottled: number } {
    this.refill();
    return {
      name: this.name,
      tokens: Math.floor(this.tokens),
      maxTokens: this.maxTokens,
      totalRequests: this.totalRequests,
      totalThrottled: this.totalThrottled,
    };
  }
}

export const outboundLimiters = {
  woocommerce: new TokenBucket({ name: "woocommerce", tokensPerSecond: 5, maxTokens: 10 }),
  signnow: new TokenBucket({ name: "signnow", tokensPerSecond: 3, maxTokens: 6 }),
  googledrive: new TokenBucket({ name: "googledrive", tokensPerSecond: 10, maxTokens: 20 }),
  stripe: new TokenBucket({ name: "stripe", tokensPerSecond: 20, maxTokens: 40 }),
};

export function getAllOutboundLimiterStats(): Record<string, ReturnType<TokenBucket["getStats"]>> {
  const result: Record<string, ReturnType<TokenBucket["getStats"]>> = {};
  for (const [key, limiter] of Object.entries(outboundLimiters)) {
    result[key] = limiter.getStats();
  }
  return result;
}
