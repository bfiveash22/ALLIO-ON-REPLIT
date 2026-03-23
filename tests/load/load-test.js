#!/usr/bin/env node
/**
 * FFPMA API Load Testing Suite
 *
 * Runs concurrent stress tests against key API endpoints:
 *   - Health check
 *   - Auth flow (login attempt)
 *   - Member dashboard data fetch
 *   - Protocol assembly trigger
 *   - Sentinel agent task routing
 *
 * Usage:
 *   node tests/load/load-test.js [--base-url <url>] [--scenario <name>] [--concurrency <n>]
 *
 * Or via:
 *   pnpm test:load
 */

'use strict';

const autocannon = require('autocannon');
const { writeFileSync, mkdirSync, existsSync } = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = process.env.LOAD_TEST_URL || 'http://localhost:5000';
const DURATION_SECONDS = parseInt(process.env.LOAD_TEST_DURATION || '10', 10);
const REPORT_DIR = path.resolve(__dirname, '../../reports/load');
const PIPELINING = 1;

// Parse CLI args
const args = process.argv.slice(2);
const argMap = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    argMap[args[i].slice(2)] = args[i + 1] || true;
    i++;
  }
}

const baseUrl = argMap['base-url'] || BASE_URL;
const filterScenario = argMap['scenario'] || null;
const cliConcurrency = argMap['concurrency'] ? parseInt(argMap['concurrency'], 10) : null;

// ---------------------------------------------------------------------------
// Concurrency levels
// ---------------------------------------------------------------------------

const CONCURRENCY_LEVELS = [10, 50, 100];

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------

const SCENARIOS = [
  {
    name: 'health-check',
    title: 'Health Check (/api/healthz)',
    description: 'Unauthenticated lightweight health probe. Should handle very high concurrency without degradation.',
    method: 'GET',
    path: '/api/healthz',
    headers: { 'Content-Type': 'application/json' },
    body: null,
    expectStatus: 200,
  },
  {
    name: 'health-extended',
    title: 'Extended Health (/api/health)',
    description: 'DB-connected health endpoint — exercises database connection pool under load.',
    method: 'GET',
    path: '/api/health',
    headers: { 'Content-Type': 'application/json' },
    body: null,
    expectStatus: 200,
  },
  {
    name: 'auth-login',
    title: 'Auth Flow (/api/auth/login)',
    description: 'Simulates concurrent login attempts. Tests rate-limiter behavior and session handling. Expected to return 401 (invalid credentials) or 429 (rate-limited).',
    method: 'POST',
    path: '/api/auth/login',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'loadtest@example.com', password: 'invalid_password_for_testing' }),
    expectStatus: [200, 401, 429],
    // These are expected non-2xx responses — not real errors
    allowedNon2xx: true,
  },
  {
    name: 'member-dashboard',
    title: 'Member Dashboard (/api/members/profile)',
    description: 'Unauthenticated access to member profile. Tests auth middleware throughput. Expected to return 401 for all unauthenticated requests.',
    method: 'GET',
    path: '/api/members/profile',
    headers: { 'Content-Type': 'application/json' },
    body: null,
    expectStatus: [200, 401, 403],
    allowedNon2xx: true,
  },
  {
    name: 'sentinel-status',
    title: 'Sentinel Status (/api/sentinel/status)',
    description: 'Agent orchestration status endpoint. Admin-only route — tests auth guard overhead and rate limiter under load. 401/403/429 are expected.',
    method: 'GET',
    path: '/api/sentinel/status',
    headers: { 'Content-Type': 'application/json' },
    body: null,
    expectStatus: [200, 401, 403, 429],
    allowedNon2xx: true,
  },
  {
    name: 'sentinel-agents',
    title: 'Sentinel Agents List (/api/sentinel/agents)',
    description: 'Lists all agents from the orchestration layer. Admin-only — tests auth + rate-limiting throughput.',
    method: 'GET',
    path: '/api/sentinel/agents',
    headers: { 'Content-Type': 'application/json' },
    body: null,
    expectStatus: [200, 401, 403, 429],
    allowedNon2xx: true,
  },
  {
    name: 'sentinel-task-dispatch',
    title: 'Sentinel Task Dispatch (/api/sentinel/tasks)',
    description: 'Concurrent task dispatch to the agent network. Tests write-under-load and rate limiting. Auth-protected.',
    method: 'POST',
    path: '/api/sentinel/tasks',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: 'ATLAS',
      title: 'Load test task',
      description: 'Synthetic task dispatched during load testing',
      priority: 3,
    }),
    expectStatus: [200, 201, 400, 401, 403, 429],
    allowedNon2xx: true,
  },
  {
    name: 'protocol-assembly-list',
    title: 'Protocol Assembly List (/api/protocol-assembly/list)',
    description: 'Fetches list of assembled protocols. Auth-protected — tests DB read path and auth middleware throughput.',
    method: 'GET',
    path: '/api/protocol-assembly/list',
    headers: { 'Content-Type': 'application/json' },
    body: null,
    expectStatus: [200, 401, 403, 429],
    allowedNon2xx: true,
  },
  {
    name: 'catalog-read',
    title: 'Catalog Read (/api/catalog)',
    description: 'Public/read-only catalog data fetch. Tests read rate-limiter and caching layer.',
    method: 'GET',
    path: '/api/catalog',
    headers: { 'Content-Type': 'application/json' },
    body: null,
    expectStatus: [200, 301, 302, 401, 404, 429],
    allowedNon2xx: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDuration(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function percentile(sorted, pct) {
  const index = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function classifyStatus(result, scenario) {
  const expectedStatuses = Array.isArray(scenario.expectStatus)
    ? scenario.expectStatus
    : [scenario.expectStatus];
  return expectedStatuses;
}

/**
 * Run autocannon for one scenario at one concurrency level.
 * Returns the raw autocannon result.
 */
function runScenario(scenario, connections) {
  return new Promise((resolve, reject) => {
    const opts = {
      url: `${baseUrl}${scenario.path}`,
      connections,
      duration: DURATION_SECONDS,
      pipelining: PIPELINING,
      method: scenario.method,
      headers: scenario.headers || {},
      timeout: 30,
    };

    if (scenario.body && (scenario.method === 'POST' || scenario.method === 'PUT' || scenario.method === 'PATCH')) {
      opts.body = scenario.body;
    }

    const instance = autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });

    autocannon.track(instance, { renderProgressBar: false });
  });
}

/**
 * Summarize a raw autocannon result into structured metrics.
 */
function summarizeResult(raw, scenario, connections) {
  const latency = raw.latency || {};
  const rps = raw.requests || {};
  const throughput = raw.throughput || {};

  // For scenarios with allowedNon2xx=true (auth-protected routes, expected 401/429),
  // only count actual network errors and timeouts — not expected non-2xx responses.
  const networkErrors = (raw.errors || 0) + (raw.timeouts || 0);
  const non2xxCount = raw.non2xx || 0;
  const errors = scenario.allowedNon2xx
    ? networkErrors
    : networkErrors + non2xxCount;

  const totalRequests = raw.requests?.total || 0;
  const errorRate = totalRequests > 0
    ? ((errors / totalRequests) * 100).toFixed(2)
    : '0.00';

  return {
    scenario: scenario.name,
    title: scenario.title,
    connections,
    duration: DURATION_SECONDS,
    allowedNon2xx: !!scenario.allowedNon2xx,
    requests: {
      total: totalRequests,
      perSecond: rps.average || 0,
      perSecondMax: rps.max || 0,
    },
    latency: {
      p50: latency.p50 || latency.median || 0,
      p75: latency.p75 || 0,
      p95: latency.p95 || 0,
      p99: latency.p99 || 0,
      max: latency.max || 0,
      mean: latency.average || latency.mean || 0,
    },
    throughput: {
      totalMB: ((throughput.total || 0) / 1024 / 1024).toFixed(2),
      perSecondKB: ((throughput.average || 0) / 1024).toFixed(2),
    },
    errors: {
      count: errors,
      rate: `${errorRate}%`,
      timeouts: raw.timeouts || 0,
      non2xx: non2xxCount,
      note: scenario.allowedNon2xx
        ? 'Error rate excludes expected non-2xx (401/403/429) — only network errors and timeouts counted'
        : undefined,
    },
    statusCodes: raw.statusCodeStats || {},
    raw,
  };
}

/**
 * Identify bottlenecks based on result metrics.
 */
function detectBottlenecks(results) {
  const bottlenecks = [];

  for (const result of results) {
    const { scenario, title, connections, latency, errors, requests } = result;

    // High p99 latency
    if (latency.p99 > 5000) {
      bottlenecks.push({
        severity: 'CRITICAL',
        scenario,
        connections,
        issue: `Extreme p99 latency: ${latency.p99}ms (threshold: 5000ms)`,
      });
    } else if (latency.p99 > 2000) {
      bottlenecks.push({
        severity: 'WARNING',
        scenario,
        connections,
        issue: `High p99 latency: ${latency.p99}ms (threshold: 2000ms)`,
      });
    }

    // High p95 latency
    if (latency.p95 > 3000) {
      bottlenecks.push({
        severity: 'WARNING',
        scenario,
        connections,
        issue: `High p95 latency: ${latency.p95}ms (threshold: 3000ms)`,
      });
    }

    // High error rate
    const errorPct = parseFloat(errors.rate);
    if (errorPct > 10) {
      bottlenecks.push({
        severity: 'CRITICAL',
        scenario,
        connections,
        issue: `High error rate: ${errors.rate} (threshold: 10%)`,
      });
    } else if (errorPct > 2) {
      bottlenecks.push({
        severity: 'WARNING',
        scenario,
        connections,
        issue: `Elevated error rate: ${errors.rate} (threshold: 2%)`,
      });
    }

    // Timeout rate
    if (result.errors.timeouts > 0) {
      bottlenecks.push({
        severity: 'WARNING',
        scenario,
        connections,
        issue: `${result.errors.timeouts} request timeout(s) detected`,
      });
    }

    // Very low throughput
    if (requests.perSecond < 10 && connections >= 50) {
      bottlenecks.push({
        severity: 'WARNING',
        scenario,
        connections,
        issue: `Low throughput: ${requests.perSecond.toFixed(1)} req/s at ${connections} connections`,
      });
    }
  }

  return bottlenecks;
}

/**
 * Generate a human-readable Markdown report.
 */
function generateMarkdownReport(allResults, bottlenecks, startTime, endTime) {
  const duration = ((endTime - startTime) / 1000).toFixed(1);
  const now = new Date(startTime).toISOString();
  const lines = [];

  lines.push('# FFPMA API Load Test Report');
  lines.push('');
  lines.push(`**Generated:** ${now}`);
  lines.push(`**Base URL:** ${baseUrl}`);
  lines.push(`**Test Duration per Scenario:** ${DURATION_SECONDS}s`);
  lines.push(`**Concurrency Levels:** ${CONCURRENCY_LEVELS.join(', ')} connections`);
  lines.push(`**Total Test Runtime:** ${duration}s`);
  lines.push('');

  // Summary table
  lines.push('## Executive Summary');
  lines.push('');

  const criticalCount = bottlenecks.filter((b) => b.severity === 'CRITICAL').length;
  const warningCount = bottlenecks.filter((b) => b.severity === 'WARNING').length;

  if (criticalCount === 0 && warningCount === 0) {
    lines.push('**Status: PASS** — No critical or warning-level bottlenecks detected.');
  } else if (criticalCount > 0) {
    lines.push(`**Status: FAIL** — ${criticalCount} critical issue(s) detected. Action required.`);
  } else {
    lines.push(`**Status: WARN** — ${warningCount} warning(s) detected. Review recommended.`);
  }
  lines.push('');
  lines.push(`- Critical issues: **${criticalCount}**`);
  lines.push(`- Warnings: **${warningCount}**`);
  lines.push(`- Scenarios tested: **${SCENARIOS.filter(s => !filterScenario || s.name === filterScenario).length}**`);
  lines.push(`- Concurrency levels: **${CONCURRENCY_LEVELS.join(', ')} connections**`);
  lines.push('');

  // Results by scenario
  lines.push('## Results by Scenario');
  lines.push('');

  const scenarios = [...new Set(allResults.map((r) => r.scenario))];
  for (const scenarioName of scenarios) {
    const scenarioResults = allResults.filter((r) => r.scenario === scenarioName);
    if (scenarioResults.length === 0) continue;
    const firstResult = scenarioResults[0];

    lines.push(`### ${firstResult.title}`);
    lines.push('');
    lines.push(`**Scenario:** \`${scenarioName}\``);
    lines.push('');
    lines.push('| Connections | Req/s (avg) | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Errors | Error Rate |');
    lines.push('|-------------|-------------|----------|----------|----------|----------|--------|------------|');

    for (const result of scenarioResults) {
      const { connections, latency, requests, errors } = result;
      lines.push(
        `| ${connections} | ${requests.perSecond.toFixed(1)} | ${latency.p50} | ${latency.p95} | ${latency.p99} | ${latency.max} | ${errors.count} | ${errors.rate} |`
      );
    }
    lines.push('');
  }

  // Bottlenecks
  lines.push('## Bottlenecks & Findings');
  lines.push('');

  if (bottlenecks.length === 0) {
    lines.push('No bottlenecks detected across all tested scenarios and concurrency levels.');
  } else {
    lines.push('| Severity | Scenario | Connections | Issue |');
    lines.push('|----------|----------|-------------|-------|');
    for (const b of bottlenecks) {
      lines.push(`| **${b.severity}** | \`${b.scenario}\` | ${b.connections} | ${b.issue} |`);
    }
  }
  lines.push('');

  // Recommendations
  lines.push('## Recommendations');
  lines.push('');
  if (bottlenecks.length === 0) {
    lines.push('- API server appears healthy under current load profiles.');
    lines.push('- Consider increasing test duration (currently 10s) for production baseline validation.');
    lines.push('- Consider running tests against a staging environment with a real database under load.');
  } else {
    const hasAuthIssues = bottlenecks.some((b) => b.scenario === 'auth-login');
    const hasLatencyIssues = bottlenecks.some((b) => b.issue.includes('latency'));
    const hasErrorIssues = bottlenecks.some((b) => b.issue.includes('error rate'));
    const hasSentinelIssues = bottlenecks.some((b) => b.scenario.includes('sentinel'));

    if (hasAuthIssues) {
      lines.push('- **Auth Endpoint:** High load on `/api/auth/login` — review rate-limiter settings and session store performance.');
    }
    if (hasLatencyIssues) {
      lines.push('- **Latency:** High p95/p99 values suggest database query bottlenecks or connection pool exhaustion. Investigate slow query logs.');
    }
    if (hasErrorIssues) {
      lines.push('- **Error Rate:** Elevated errors under load — review rate-limiter thresholds and upstream dependencies.');
    }
    if (hasSentinelIssues) {
      lines.push('- **Sentinel/Agent Layer:** Bottlenecks in agent orchestration endpoints — consider caching agent status and task routing responses.');
    }
    lines.push('- Run `pnpm test:load` after each major deployment to track regression.');
  }
  lines.push('');

  lines.push('---');
  lines.push(`*Report generated by FFPMA load test suite — ${now}*`);

  return lines.join('\n');
}

/**
 * Generate a JSON summary for programmatic consumption.
 */
function generateJsonReport(allResults, bottlenecks, startTime, endTime) {
  return {
    meta: {
      generatedAt: new Date(startTime).toISOString(),
      baseUrl,
      durationPerScenario: DURATION_SECONDS,
      concurrencyLevels: CONCURRENCY_LEVELS,
      totalRuntimeMs: endTime - startTime,
    },
    summary: {
      totalScenarios: [...new Set(allResults.map((r) => r.scenario))].length,
      totalRuns: allResults.length,
      criticalIssues: bottlenecks.filter((b) => b.severity === 'CRITICAL').length,
      warnings: bottlenecks.filter((b) => b.severity === 'WARNING').length,
      status:
        bottlenecks.filter((b) => b.severity === 'CRITICAL').length > 0
          ? 'FAIL'
          : bottlenecks.length > 0
          ? 'WARN'
          : 'PASS',
    },
    results: allResults.map((r) => ({
      scenario: r.scenario,
      title: r.title,
      connections: r.connections,
      duration: r.duration,
      requests: r.requests,
      latency: r.latency,
      throughput: r.throughput,
      errors: r.errors,
      statusCodes: r.statusCodes,
    })),
    bottlenecks,
  };
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

async function main() {
  const scenarios = filterScenario
    ? SCENARIOS.filter((s) => s.name === filterScenario)
    : SCENARIOS;

  if (scenarios.length === 0) {
    console.error(`No scenario found matching: ${filterScenario}`);
    console.error(`Available: ${SCENARIOS.map((s) => s.name).join(', ')}`);
    process.exit(1);
  }

  const concurrencyLevels = cliConcurrency ? [cliConcurrency] : CONCURRENCY_LEVELS;

  console.log('\n=================================================');
  console.log('  FFPMA API Load Testing Suite');
  console.log('=================================================');
  console.log(`Base URL:    ${baseUrl}`);
  console.log(`Scenarios:   ${scenarios.map((s) => s.name).join(', ')}`);
  console.log(`Concurrency: ${concurrencyLevels.join(', ')} connections`);
  console.log(`Duration:    ${DURATION_SECONDS}s per run`);
  console.log('=================================================\n');

  const allResults = [];
  const startTime = Date.now();

  for (const scenario of scenarios) {
    console.log(`\n--- Scenario: ${scenario.title} ---`);

    for (const connections of concurrencyLevels) {
      process.stdout.write(`  [${connections} connections] Running... `);
      try {
        const raw = await runScenario(scenario, connections);
        const result = summarizeResult(raw, scenario, connections);
        allResults.push(result);

        const { latency, requests, errors } = result;
        console.log(
          `done — ${requests.perSecond.toFixed(1)} req/s | p50:${latency.p50}ms p95:${latency.p95}ms p99:${latency.p99}ms | errors:${errors.rate}`
        );
      } catch (err) {
        console.log(`FAILED — ${err.message}`);
        allResults.push({
          scenario: scenario.name,
          title: scenario.title,
          connections,
          duration: DURATION_SECONDS,
          requests: { total: 0, perSecond: 0, perSecondMax: 0 },
          latency: { p50: 0, p75: 0, p95: 0, p99: 0, max: 0, mean: 0 },
          throughput: { totalMB: '0.00', perSecondKB: '0.00' },
          errors: { count: 0, rate: '100.00%', timeouts: 0, non2xx: 0 },
          statusCodes: {},
          error: err.message,
        });
      }

      // Brief cooldown between runs to avoid cascading rate limits
      if (connections < concurrencyLevels[concurrencyLevels.length - 1]) {
        await sleep(1000);
      }
    }

    // Cooldown between scenarios
    await sleep(2000);
  }

  const endTime = Date.now();

  // Detect bottlenecks
  const bottlenecks = detectBottlenecks(allResults);

  // Save reports
  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const mdPath = path.join(REPORT_DIR, `load-test-report-${timestamp}.md`);
  const jsonPath = path.join(REPORT_DIR, `load-test-report-${timestamp}.json`);
  const latestMdPath = path.join(REPORT_DIR, 'load-test-latest.md');
  const latestJsonPath = path.join(REPORT_DIR, 'load-test-latest.json');

  const mdReport = generateMarkdownReport(allResults, bottlenecks, startTime, endTime);
  const jsonReport = generateJsonReport(allResults, bottlenecks, startTime, endTime);

  writeFileSync(mdPath, mdReport, 'utf-8');
  writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2), 'utf-8');
  writeFileSync(latestMdPath, mdReport, 'utf-8');
  writeFileSync(latestJsonPath, JSON.stringify(jsonReport, null, 2), 'utf-8');

  // Print summary
  console.log('\n=================================================');
  console.log('  LOAD TEST SUMMARY');
  console.log('=================================================');
  console.log(`Status:   ${jsonReport.summary.status}`);
  console.log(`Runs:     ${allResults.length} (${scenarios.length} scenarios × ${concurrencyLevels.length} concurrency levels)`);
  console.log(`Critical: ${jsonReport.summary.criticalIssues}`);
  console.log(`Warnings: ${jsonReport.summary.warnings}`);
  console.log('');
  console.log(`Reports saved to:`);
  console.log(`  ${mdPath}`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${latestMdPath} (latest symlink)`);
  console.log('=================================================\n');

  if (bottlenecks.length > 0) {
    console.log('BOTTLENECKS DETECTED:');
    for (const b of bottlenecks) {
      console.log(`  [${b.severity}] ${b.scenario} @ ${b.connections} conns: ${b.issue}`);
    }
    console.log('');
  }

  // Exit with non-zero if critical issues found
  if (jsonReport.summary.status === 'FAIL') {
    process.exit(2);
  }
}

main().catch((err) => {
  console.error('Load test runner error:', err);
  process.exit(1);
});
