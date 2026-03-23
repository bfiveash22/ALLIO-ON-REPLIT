# Agent Tool-Calling Validation & Testing

Comprehensive test suite for the 46-agent Allio/FFPMA ecosystem. Covers
`buildDivisionToolSet`, Sentinel routing, MCP server connectivity, PMA
compliance filtering, and end-to-end task dispatch across all 7 divisions.

## Running the Tests

```bash
# Run all agent tests (mocked, default CI path)
pnpm test:agents

# Run with verbose output
pnpm test:agents --reporter verbose

# Run a single test file
pnpm test:agents tests/agents/pma-compliance.test.ts

# Run live MCP connectivity smoke tests (requires real MCP servers available)
MCP_LIVE_TEST=true pnpm test:agents tests/agents/mcp-connectivity.test.ts
```

## Test Files

| File | What it covers |
|---|---|
| `tool-dispatcher.test.ts` | `buildDivisionToolSet` schema, per-division required/forbidden tools, dispatcher routing, error handling |
| `sentinel-routing.test.ts` | Keyword-to-division routing for all 7 divisions, cross-division coordination, priority classification, notification semantics |
| `mcp-connectivity.test.ts` | MCP server registry shape, division access control, health reporting, `connectServer` success/failure/timeout/SSE paths |
| `pma-compliance.test.ts` | All 9 PMA prohibited terms, score-based gating for `protocol-generation`/`document-generation` call types, compliant replacement table, expected fields validation |
| `integration-e2e.test.ts` | Full Sentinel→dispatcher→tool pipeline for Science, Legal, Marketing, and Engineering divisions plus cross-division coordination |

## Architecture

### Default (Mocked) Mode

All tests run with the MCP SDK mocked (`@modelcontextprotocol/sdk/client/index.js`),
making the suite deterministic and suitable for CI. The mock simulates:

- Successful `connect()` + `listTools()` returning a small tool manifest
- Connection errors (`mockRejectedValue`)
- Connection timeouts (never-resolving promise with short `healthCheckTimeoutMs`)
- Unsupported transports (SSE returns `null`)

### Live MCP Smoke Test Mode (opt-in)

When `MCP_LIVE_TEST=true` is set, `mcp-connectivity.test.ts` includes an
additional describe block that iterates every server returned by
`getMcpServerRegistry()` and verifies:

1. `connectServer()` resolves non-null within the server's configured timeout
2. At least one tool is discovered in the returned manifest
3. `getServerHealth()` reports `connected` status for the server

Use this mode for pre-release validation or scheduled health checks where
real MCP server processes (GitHub, filesystem, etc.) are available.

## PMA Compliance Rules

The PMA compliance filter enforces Forgotten Formula PMA constitutional
protections. The following terms are **prohibited** in protocol and document
generation outputs, with their required compliant replacements:

| Prohibited | Use instead |
|---|---|
| treatment | protocol |
| treat | address |
| diagnosis | assessment |
| diagnose | evaluate |
| prescribe | recommend |
| prescription | protocol recommendation |
| patient | member |
| medical advice | wellness education |
| cure | support the body's natural healing |

Prohibited term detection applies only to `protocol-generation`,
`protocol-builder`, and `document-generation` call types. Each detected term
reduces the response quality score, and responses below threshold are flagged
for rewrite.

## Division Reference

| Division | Code Name | Key Routing Keywords |
|---|---|---|
| Engineering | FORGE | integration, api, platform, database, infrastructure |
| Science | HELIX | blood, analysis, protocol, rife, frequency, biomarker |
| Legal | JURIS | legal, compliance, document, contract, pma |
| Marketing | MUSE | video, content, campaign, social, copywriting |
| Financial | LEDGER | payment, crypto, billing, finance, invoice |
| Executive | APEX | strategy, executive, reporting, planning |
| Support | ANCHOR | support, member, onboarding, help, ticket |
