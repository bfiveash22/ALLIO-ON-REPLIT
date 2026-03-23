import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { circuitBreakers, CircuitState } from "./circuit-breaker";
import { outboundLimiters } from "./rate-limiter";
import { logger } from "./logger";

type ProtectedService = keyof typeof outboundLimiters;

const SERVICE_URL_PATTERNS: Array<{ pattern: string | RegExp; service: ProtectedService }> = [
  { pattern: "api.signnow.com", service: "signnow" },
  { pattern: "googleapis.com", service: "googledrive" },
  { pattern: "api.stripe.com", service: "stripe" },
];

if (process.env.WOOCOMMERCE_URL) {
  const host = process.env.WOOCOMMERCE_URL.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (host) {
    SERVICE_URL_PATTERNS.push({ pattern: host, service: "woocommerce" });
  }
}

function detectService(url?: string): ProtectedService | null {
  if (!url) return null;
  for (const { pattern, service } of SERVICE_URL_PATTERNS) {
    if (typeof pattern === "string" ? url.includes(pattern) : pattern.test(url)) {
      return service;
    }
  }
  return null;
}

let interceptorsRegistered = false;

export function registerAxiosInterceptors(): void {
  if (interceptorsRegistered) return;
  interceptorsRegistered = true;

  axios.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const service = detectService(config.url);
    if (!service) return config;

    const breaker = circuitBreakers[service];
    const limiter = outboundLimiters[service];
    const state = breaker.getStats().state as CircuitState;

    if (state === "OPEN") {
      logger.warn(`Circuit breaker OPEN for ${service}, blocking outbound request`, {
        source: service,
        url: config.url,
      });
      return Promise.reject(new Error(`Circuit breaker [${service}] is OPEN — refusing outbound call`));
    }

    await limiter.consume();
    return config;
  });

  axios.interceptors.response.use(
    (response: AxiosResponse) => {
      const service = detectService(response.config.url);
      if (service) {
        circuitBreakers[service].recordSuccess();
      }
      return response;
    },
    (error: AxiosError) => {
      const service = detectService(error.config?.url);
      if (service) {
        if (!error.response || error.response.status >= 500) {
          logger.warn(`External call failed for ${service} — recording circuit breaker failure`, {
            source: service,
            url: error.config?.url,
            status: error.response?.status,
            error: error.message,
          });
          circuitBreakers[service].recordFailure();
        }
      }
      return Promise.reject(error);
    }
  );

  logger.info("Axios interceptors registered for outbound protection", { source: "startup" });
}
